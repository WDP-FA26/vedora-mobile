import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BrandColors, Fonts, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { ApiError } from '@/shared/api/api-error';
import { useSessionStore } from '@/shared/stores/session-store';

import { useDietaryRestrictions, useMealPlan, useSaveMealDays } from '../hooks/use-meal-plan';
import { askMealPlanner, getMealPlan } from '../services/meal-plan.service';
import { proposalSchema, type MealPlanProposal, type Weekday } from '../types/meal-plan.schema';
import { changedDayInputs, dayLabels, displayDays, sectionLabels } from '../utils/meal-plan';
import { MealRequestForm } from './meal-request-form';

type Proposal = MealPlanProposal & { id: string };
type ChatTurn = { id: number; role: 'user' | 'assistant'; text: string; refused?: boolean; proposal?: Proposal; streaming?: boolean };

/** Replaces the turn with the same id, or appends it. */
function upsertTurn(turns: ChatTurn[], next: ChatTurn) {
  return turns.some((turn) => turn.id === next.id) ? turns.map((turn) => turn.id === next.id ? next : turn) : [...turns, next];
}
type ProposalStatus = 'staged' | 'saved' | 'dismissed';
type PlanMode = 'auto' | 'form' | 'timetable';
type Preset = 'week' | 'quick' | 'pantry';

function proposalContext(proposal: Proposal, status?: ProposalStatus) {
  const state = status === 'saved' ? 'người dùng đã lưu thực đơn'
    : status === 'staged' ? 'người dùng đang xem bản nháp, chưa lưu'
      : status === 'dismissed' ? 'người dùng đã bỏ qua' : 'chưa áp dụng';
  const meals = proposal.days.map(({ day, sections }) => {
    const filled = sections.filter(({ recipes }) => recipes.length).map(({ section, recipes }) =>
      `${sectionLabels[section].toLowerCase()}: ${recipes.map(({ title, id }) => `${title} (id ${id})`).join(', ')}`);
    return `${dayLabels[day]} (${filled.join('; ') || 'trống'})`;
  }).join(' | ');
  return `[Đề xuất (${state}): ${meals}]`;
}

function friendlyError(error: unknown, fallback: string) {
  if (error instanceof ApiError) {
    if (error.status === 401) return 'Phiên đăng nhập đã hết hạn. Hãy đăng nhập lại.';
    if (error.status === 429) return 'Bạn gửi hơi nhanh. Hãy đợi một chút rồi thử lại.';
    if (error.status === 503) return 'Trợ lý đang tạm nghỉ. Hãy thử lại sau.';
    if (error.status === 409) return 'Thực đơn hoặc thông tin ăn uống đã thay đổi. Hãy kiểm tra lại trước khi lưu.';
  }
  if (error instanceof Error && error.message.startsWith('Thực đơn đã thay đổi')) return error.message;
  return fallback;
}

export function MealPlannerScreen() {
  const theme = useTheme();
  const token = useSessionStore((s) => s.accessToken);
  const hydrated = useSessionStore((s) => s.isHydrated);
  const plan = useMealPlan(token);
  const dietary = useDietaryRestrictions(token);
  const save = useSaveMealDays(token);
  const [tab, setTab] = useState<'chat' | 'plan'>('chat');
  const [planMode, setPlanMode] = useState<PlanMode>('auto');
  const [formKey, setFormKey] = useState(0);
  const [preset, setPreset] = useState<Preset>('week');
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [composer, setComposer] = useState('');
  const [busy, setBusy] = useState(false);
  const [chatError, setChatError] = useState('');
  const [saveError, setSaveError] = useState('');
  const [suggestion, setSuggestion] = useState<Proposal | null>(null);
  const [draft, setDraft] = useState<Proposal | null>(null);
  const [statuses, setStatuses] = useState<Record<string, ProposalStatus>>({});
  const [selectedDay, setSelectedDay] = useState<Weekday>('MON');
  const scroll = useRef<ScrollView>(null);
  const sending = useRef(false);
  const nextId = useRef(1);
  const streamIds = useRef<number[]>([]);
  const savedHasMeals = !!plan.data?.days.some((day) => day.sections.some((section) => section.recipes.length));
  const mode = draft ? 'timetable' : planMode === 'auto' ? (savedHasMeals ? 'timetable' : 'form') : planMode;
  const days = useMemo(() => displayDays(plan.data, draft), [plan.data, draft]);
  const activeDay = days.find(({ day }) => day === selectedDay) ?? days[0];
  const latestProposalId = turns.flatMap((turn) => turn.proposal ? [turn.proposal.id] : []).at(-1) ?? null;

  function startForm(nextPreset: Preset = 'week') {
    setPreset(nextPreset);
    setFormKey((key) => key + 1);
    setPlanMode('form');
    setTab('plan');
  }

  async function sendMessage() {
    const text = composer.trim();
    if (sending.current) return;
    if (!text) { setChatError('Nhập câu hỏi hoặc yêu cầu trước khi gửi.'); return; }
    if (text.length > 4000) { setChatError('Tin nhắn tối đa 4.000 ký tự.'); return; }
    sending.current = true;
    streamIds.current = [];
    setBusy(true);
    setChatError('');
    try {
      const context = turns.filter((turn) => !turn.refused && turn.text).map((turn) => ({
        role: turn.role,
        text: [turn.text, turn.proposal ? proposalContext(turn.proposal, statuses[turn.proposal.id]) : ''].filter(Boolean).join('\n').slice(0, 4000),
      }));
      const userId = nextId.current++;
      const assistantId = nextId.current++;
      streamIds.current = [userId, assistantId];
      setTurns((old) => [...old, { id: userId, role: 'user', text }]);
      setComposer('');
      const result = await askMealPlanner([...context, { role: 'user', text }], (partial) => {
        setTurns((old) => upsertTurn(old, { id: assistantId, role: 'assistant', text: partial, streaming: true }));
      });
      const proposed = result.tools.filter((tool) => tool.name.replace(/^tool-/, '') === 'proposeMealPlan')
        .map((tool) => ({ tool, output: proposalSchema.safeParse(tool.output) }))
        .find(({ output }) => output.success && output.data.ok);
      const proposal: Proposal | undefined = proposed?.output.success
        ? { ...proposed.output.data, id: proposed.tool.callId } : undefined;
      setTurns((old) => upsertTurn(old.map((turn) => turn.id === userId ? { ...turn, refused: result.refused } : turn), {
        id: assistantId,
        role: 'assistant',
        text: result.text || (proposal ? 'Mình đã chuẩn bị đề xuất thực đơn để bạn xem trước.' : 'Mình chưa thể đề xuất thực đơn lúc này.'),
        refused: result.refused,
        proposal,
      }));
      if (proposal) setSuggestion(proposal);
    } catch (error) {
      // Drop the question and any partial answer, and give the text back so it can be resent.
      const failed = streamIds.current;
      setTurns((old) => old.filter((turn) => !failed.includes(turn.id)));
      setComposer(text);
      setChatError(friendlyError(error, 'Chưa gửi được yêu cầu. Nội dung vẫn còn để bạn thử lại.'));
    } finally {
      sending.current = false;
      setBusy(false);
    }
  }

  function previewProposal(proposal: Proposal) {
    if (proposal.id !== latestProposalId || statuses[proposal.id]) return;
    const apply = () => {
      if (draft && draft.id !== proposal.id) setStatuses((old) => ({ ...old, [draft.id]: 'dismissed' }));
      setStatuses((old) => ({ ...old, [proposal.id]: 'staged' }));
      setDraft(proposal); setSuggestion(null); setSaveError(''); setPlanMode('timetable'); setTab('plan');
    };
    if (draft && draft.id !== proposal.id) Alert.alert('Thay bản xem trước?', 'Đề xuất mới sẽ thay bản chưa lưu đang xem.', [
      { text: 'Giữ bản hiện tại', style: 'cancel' }, { text: 'Thay đề xuất', onPress: apply },
    ]);
    else apply();
  }

  async function saveDraft() {
    if (!draft || save.isPending || !token) return;
    setSaveError('');
    try {
      const fresh = await getMealPlan();
      const changes = changedDayInputs(draft, fresh);
      if (!changes.length) { setSaveError('Đề xuất này không có thay đổi để lưu.'); return; }
      await save.mutateAsync(changes);
      setStatuses((old) => ({ ...old, [draft.id]: 'saved' }));
      setDraft(null);
      setPlanMode('timetable');
    } catch (error) {
      setSaveError(friendlyError(error, 'Không lưu được thực đơn. Đề xuất vẫn còn để bạn thử lại.'));
    }
  }

  if (!hydrated) return <SafeAreaView edges={['top']} style={[styles.screen, styles.center, { backgroundColor: theme.background }]}><ActivityIndicator color={theme.primary} /></SafeAreaView>;
  if (!token) return <SafeAreaView edges={['top']} style={[styles.screen, { backgroundColor: theme.background }]}><View style={styles.guest}>
    <Image source={require('@/assets/branding/tomato-sticker.png')} style={styles.guestSticker} resizeMode="contain" accessibilityLabel="Hình cà chua Vedora" />
    <Text style={[styles.title, { color: theme.foreground }]}>Lên thực đơn cùng Vedora</Text>
    <Text style={[styles.guestText, { color: theme.mutedForeground }]}>Đăng nhập để dùng hồ sơ ăn uống, trò chuyện với trợ lý và lưu thực đơn 7 ngày.</Text>
    <Pressable accessibilityRole="button" onPress={() => router.push({ pathname: '/login', params: { returnTo: '/meal-plan' } })} style={[styles.primaryButton, { backgroundColor: theme.primary }]}><Text style={[styles.primaryText, { color: theme.primaryForeground }]}>Đăng nhập</Text></Pressable>
    <Pressable accessibilityRole="button" onPress={() => router.push({ pathname: '/register', params: { returnTo: '/meal-plan' } })} style={[styles.outlineButton, { borderColor: theme.border }]}><Text style={[styles.outlineText, { color: theme.primary }]}>Tạo tài khoản</Text></Pressable>
  </View></SafeAreaView>;

  return <SafeAreaView edges={['top']} style={[styles.screen, { backgroundColor: theme.background }]}>
    <View style={[styles.header, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
      <View style={styles.headerText}><Text style={[styles.eyebrow, { color: theme.primary }]}>TRỢ LÝ VEDORA</Text><Text style={[styles.title, { color: theme.foreground }]}>Lên thực đơn</Text><Text style={[styles.subtitle, { color: theme.mutedForeground }]}>Chọn món và lên kế hoạch bữa ăn mỗi tuần</Text></View>
      <Image source={require('@/assets/branding/tomato-sticker.png')} style={styles.sticker} resizeMode="contain" accessibilityLabel="Hình cà chua Vedora" />
    </View>
    <View accessibilityRole="tablist" style={[styles.segment, { backgroundColor: theme.muted }]}>
      {(['chat', 'plan'] as const).map((option) => <Pressable key={option} accessibilityRole="tab" accessibilityState={{ selected: tab === option }} onPress={() => setTab(option)} style={[styles.segmentItem, { backgroundColor: tab === option ? theme.card : 'transparent' }]}>
        <SymbolView name={option === 'chat' ? { ios: 'bubble.left.and.bubble.right', android: 'forum', web: 'forum' } : { ios: 'calendar', android: 'calendar_month', web: 'calendar_month' }} size={17} tintColor={tab === option ? theme.primary : theme.mutedForeground} />
        <Text style={[styles.segmentText, { color: tab === option ? theme.primary : theme.mutedForeground }]}>{option === 'chat' ? 'Trợ lý' : 'Thực đơn'}</Text>
        {option === 'plan' && suggestion ? <View style={styles.dot} /> : null}
      </Pressable>)}
    </View>
    <KeyboardAvoidingView style={[styles.flex, tab !== 'chat' && styles.hidden]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView ref={scroll} style={styles.flex} contentContainerStyle={styles.chatContent} keyboardShouldPersistTaps="handled" onContentSizeChange={() => scroll.current?.scrollToEnd({ animated: true })}>
        <View style={styles.assistantRow}><View style={[styles.assistantMark, { backgroundColor: theme.primary }]}><Text style={styles.markText}>V</Text></View><Text style={[styles.assistantName, { color: theme.foreground }]}>Trợ lý Vedora</Text></View>
        <Text style={[styles.welcome, { color: theme.foreground }]}>Bạn muốn lên thực đơn hay tìm hiểu thêm về món chay? Mình có thể giúp chọn món theo sở thích, thời gian nấu và thành phần cần tránh.</Text>
        {turns.length === 0 ? <View style={styles.quickList}>
          {([['Lên thực đơn 7 ngày', 'week'], ['Mỗi bữa nấu trong 30 phút', 'quick'], ['Tận dụng nguyên liệu đang có', 'pantry']] as const).map(([label, choice]) => <Pressable key={label} accessibilityRole="button" onPress={() => startForm(choice)} style={[styles.quickChip, { borderColor: theme.border, backgroundColor: theme.card }]}><Text style={[styles.quickText, { color: theme.foreground }]}>{label}</Text></Pressable>)}
          <Pressable accessibilityRole="button" onPress={() => setComposer('Mình muốn hỏi về nguyên liệu và dinh dưỡng.')} style={[styles.quickChip, { borderColor: theme.border, backgroundColor: theme.card }]}><Text style={[styles.quickText, { color: theme.foreground }]}>Hỏi về nguyên liệu và dinh dưỡng</Text></Pressable>
        </View> : null}
        {turns.map((turn) => <View key={turn.id} style={[styles.bubble, turn.role === 'user' ? styles.userBubble : styles.aiBubble, { borderColor: theme.border, backgroundColor: turn.role === 'user' ? theme.secondary : theme.card }]}>
          <Text style={[styles.bubbleBy, { color: theme.primary }]}>{turn.role === 'user' ? 'Bạn' : 'Trợ lý Vedora'}</Text><Text style={[styles.bubbleText, { color: theme.foreground }]}>{turn.text}{turn.streaming ? ' ▍' : ''}</Text>
          {turn.proposal?.id === latestProposalId && !statuses[turn.proposal.id] ? <Pressable accessibilityRole="button" onPress={() => previewProposal(turn.proposal!)} style={[styles.smallPrimary, { backgroundColor: theme.primary }]}><Text style={[styles.smallPrimaryText, { color: theme.primaryForeground }]}>Xem đề xuất  →</Text></Pressable> : null}
        </View>)}
        {busy && !turns.some((turn) => turn.streaming) ? <View style={styles.loadingRow}><ActivityIndicator size="small" color={theme.primary} /><Text style={[styles.helper, { color: theme.mutedForeground }]}>Trợ lý đang trả lời…</Text></View> : null}
        {chatError ? <Text accessibilityRole="alert" style={[styles.error, { color: theme.destructive }]}>{chatError}</Text> : null}
        {chatError.includes('đăng nhập') ? <Pressable accessibilityRole="button" onPress={() => router.push({ pathname: '/login', params: { returnTo: '/meal-plan' } })}><Text style={[styles.link, { color: theme.primary }]}>Đăng nhập lại</Text></Pressable> : null}
      </ScrollView>
      <View style={[styles.composerWrap, { backgroundColor: theme.card, borderTopColor: theme.border }]}><View style={[styles.composerBox, { backgroundColor: theme.muted }]}>
        <TextInput accessibilityLabel="Hỏi hoặc yêu cầu đổi món" value={composer} onChangeText={(value) => { setComposer(value); setChatError(''); }} multiline maxLength={4000} placeholder="Hỏi về món chay hoặc yêu cầu đổi món…" placeholderTextColor={theme.mutedForeground} style={[styles.composerInput, { color: theme.foreground }]} />
        <Pressable accessibilityRole="button" accessibilityLabel="Gửi yêu cầu" accessibilityState={{ disabled: busy }} disabled={busy} onPress={() => void sendMessage()} style={[styles.sendButton, { backgroundColor: busy ? theme.mutedForeground : theme.primary }]}><SymbolView name={{ ios: 'arrow.up', android: 'arrow_upward', web: 'arrow_upward' }} size={19} tintColor={theme.primaryForeground} /></Pressable>
      </View><Text style={[styles.hint, { color: theme.mutedForeground }]}>Đề xuất chỉ thay đổi thực đơn sau khi bạn lưu.</Text></View>
    </KeyboardAvoidingView>
    <ScrollView style={[styles.flex, tab !== 'plan' && styles.hidden]} contentContainerStyle={styles.planContent} keyboardShouldPersistTaps="handled">
      {plan.isPending && !plan.data ? <View style={styles.loadingRow}><ActivityIndicator color={theme.primary} /><Text style={[styles.helper, { color: theme.mutedForeground }]}>Đang tải thực đơn…</Text></View> : null}
      {plan.isError ? <Pressable accessibilityRole="button" onPress={() => void plan.refetch()} style={[styles.notice, { borderColor: theme.destructive }]}><Text style={[styles.error, { color: theme.destructive }]}>Không tải được thực đơn đã lưu. Chạm để thử lại.</Text></Pressable> : null}
      {suggestion ? <View style={[styles.suggestion, { borderColor: theme.border, backgroundColor: theme.secondary }]}><Text style={[styles.sectionTitle, { color: theme.foreground }]}>Đề xuất mới từ trợ lý</Text><Text style={[styles.helper, { color: theme.mutedForeground }]}>Thực đơn đã lưu chưa thay đổi. Xem trước khi quyết định.</Text><Pressable accessibilityRole="button" onPress={() => previewProposal(suggestion)} style={[styles.smallPrimary, { backgroundColor: theme.primary }]}><Text style={[styles.smallPrimaryText, { color: theme.primaryForeground }]}>Xem đề xuất</Text></Pressable></View> : null}
      {plan.isPending && !plan.data ? null : mode === 'form' ? <MealRequestForm key={formKey} restrictions={dietary.data} loading={dietary.isPending} failed={dietary.isError} retry={() => void dietary.refetch()} onContinue={(prompt) => { setComposer(prompt); setTab('chat'); }} seed={preset} /> : <>
        <View style={styles.planHeading}><View style={styles.flex}><Text style={[styles.planTitle, { color: theme.foreground }]}>Thực đơn tuần</Text><Text style={[styles.helper, { color: theme.mutedForeground }]}>{draft ? 'Bản xem trước, chưa lưu' : 'Lặp lại theo thứ trong tuần'}</Text></View><Pressable accessibilityRole="button" onPress={() => startForm()} style={[styles.outlineButton, { borderColor: theme.border }]}><Text style={[styles.outlineText, { color: theme.primary }]}>Lên thực đơn</Text></Pressable></View>
        {draft ? <View style={[styles.suggestion, { borderColor: theme.border, backgroundColor: theme.secondary }]}><Text style={[styles.sectionTitle, { color: theme.foreground }]}>Đề xuất chưa được lưu</Text><Text style={[styles.helper, { color: theme.mutedForeground }]}>Kiểm tra từng ngày rồi xác nhận cập nhật thực đơn.</Text>{saveError ? <Text accessibilityRole="alert" style={[styles.error, { color: theme.destructive }]}>{saveError}</Text> : null}<View style={styles.actions}><Pressable accessibilityRole="button" accessibilityState={{ disabled: save.isPending }} disabled={save.isPending} onPress={() => void saveDraft()} style={[styles.smallPrimary, { backgroundColor: theme.primary }]}><Text style={[styles.smallPrimaryText, { color: theme.primaryForeground }]}>{save.isPending ? 'Đang lưu…' : 'Lưu thực đơn'}</Text></Pressable><Pressable accessibilityRole="button" accessibilityState={{ disabled: save.isPending }} disabled={save.isPending} onPress={() => { setStatuses((old) => ({ ...old, [draft.id]: 'dismissed' })); setDraft(null); setSaveError(''); }} style={[styles.outlineButton, { borderColor: theme.border }]}><Text style={[styles.outlineText, { color: theme.foreground }]}>Bỏ đề xuất</Text></Pressable></View></View> : null}
        {Boolean(plan.data?.problems.length) && !draft ? <View style={[styles.notice, { borderColor: theme.destructive }]}><Text style={[styles.error, { color: theme.destructive }]}>Một số bữa cần xem lại: {plan.data?.problems.map((problem) => `${dayLabels[problem.day]}: ${problem.reason || problem.ingredients.join(', ') || problem.code}`).join('; ')}</Text></View> : null}
        {days.length ? <><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dayList}>{days.map(({ day }) => <Pressable key={day} accessibilityRole="button" accessibilityState={{ selected: activeDay?.day === day }} onPress={() => setSelectedDay(day)} style={[styles.dayChip, { borderColor: activeDay?.day === day ? theme.primary : theme.border, backgroundColor: activeDay?.day === day ? theme.primary : theme.card }]}><Text style={[styles.dayText, { color: activeDay?.day === day ? theme.primaryForeground : theme.foreground }]}>{dayLabels[day]}</Text></Pressable>)}</ScrollView>
          {activeDay ? <View style={styles.dayBody}><Text style={[styles.dayTitle, { color: theme.foreground }]}>{dayLabels[activeDay.day]}</Text>{activeDay.sections.map(({ section, recipes }) => <View key={section} style={styles.mealBlock}><Text style={[styles.mealLabel, { color: theme.mutedForeground }]}>BỮA {sectionLabels[section].toUpperCase()}</Text>{recipes.length ? recipes.map((recipe) => <View key={recipe.id} style={[styles.recipeCard, { borderColor: theme.border, backgroundColor: theme.card }]}><Text style={[styles.recipeTitle, { color: theme.foreground }]}>{recipe.title}</Text>{!draft ? <Pressable accessibilityRole="button" accessibilityLabel={`Đổi món ${recipe.title}`} onPress={() => { setComposer(`Đề xuất món khác thay cho "${recipe.title}" ở ${dayLabels[activeDay.day]}, bữa ${sectionLabels[section].toLowerCase()}. Chỉ đổi bữa này, hãy cho tôi xem đề xuất trước khi lưu.`); setTab('chat'); }}><Text style={[styles.link, { color: theme.primary }]}>Đổi món</Text></Pressable> : null}</View>) : <Text style={[styles.emptyMeal, { color: theme.mutedForeground, borderColor: theme.border }]}>Chưa có món cho bữa này</Text>}</View>)}</View> : null}
        </> : <View style={[styles.emptyPlan, { borderColor: theme.border, backgroundColor: theme.card }]}><Text style={[styles.sectionTitle, { color: theme.foreground }]}>Tuần này mình ăn gì?</Text><Text style={[styles.helper, { color: theme.mutedForeground }]}>Điền yêu cầu hoặc hỏi trợ lý để có đề xuất thực đơn.</Text><Pressable accessibilityRole="button" onPress={() => startForm()} style={[styles.smallPrimary, { backgroundColor: theme.primary }]}><Text style={[styles.smallPrimaryText, { color: theme.primaryForeground }]}>Bắt đầu lên thực đơn</Text></Pressable></View>}
      </>}
    </ScrollView>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  screen: { flex: 1 }, flex: { flex: 1 }, hidden: { display: 'none' }, center: { alignItems: 'center', justifyContent: 'center' },
  header: { minHeight: 92, borderBottomWidth: 1, paddingHorizontal: Spacing.three, flexDirection: 'row', alignItems: 'center' }, headerText: { flex: 1 },
  eyebrow: { fontFamily: Fonts.sansBold, fontSize: 10, letterSpacing: 1.4 }, title: { fontFamily: Fonts.headingBold, fontSize: 22, lineHeight: 31 }, subtitle: { fontFamily: Fonts.sans, fontSize: 12, lineHeight: 18 }, sticker: { width: 76, height: 76 },
  segment: { flexDirection: 'row', marginHorizontal: Spacing.three, marginTop: Spacing.two, padding: 4, borderRadius: Radius.xl }, segmentItem: { flex: 1, minHeight: 42, borderRadius: Radius.lg, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 }, segmentText: { fontFamily: Fonts.sansBold, fontSize: 14 }, dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: BrandColors.orange },
  chatContent: { width: '100%', maxWidth: 620, alignSelf: 'center', padding: Spacing.three, paddingBottom: Spacing.four, gap: Spacing.three }, assistantRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two }, assistantMark: { width: 31, height: 31, borderRadius: 16, alignItems: 'center', justifyContent: 'center' }, markText: { color: '#fffefa', fontFamily: Fonts.headingBold, fontSize: 17 }, assistantName: { fontFamily: Fonts.sansBold, fontSize: 14 }, welcome: { fontFamily: Fonts.sans, fontSize: 15, lineHeight: 23 },
  quickList: { alignItems: 'flex-start', gap: Spacing.two, marginTop: Spacing.two }, quickChip: { borderWidth: 1, borderRadius: 24, minHeight: 42, justifyContent: 'center', paddingHorizontal: Spacing.three }, quickText: { fontFamily: Fonts.sans, fontSize: 14 },
  bubble: { maxWidth: '94%', padding: Spacing.three, borderWidth: 1, borderRadius: Radius['2xl'], gap: Spacing.one }, userBubble: { alignSelf: 'flex-end' }, aiBubble: { alignSelf: 'flex-start' }, bubbleBy: { fontFamily: Fonts.sansBold, fontSize: 12 }, bubbleText: { fontFamily: Fonts.sans, fontSize: 14, lineHeight: 21 },
  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, paddingVertical: Spacing.two }, helper: { fontFamily: Fonts.sans, fontSize: 13, lineHeight: 19 }, error: { fontFamily: Fonts.sansMedium, fontSize: 13, lineHeight: 19 }, link: { fontFamily: Fonts.sansBold, fontSize: 12 },
  composerWrap: { borderTopWidth: 1, paddingHorizontal: Spacing.three, paddingTop: Spacing.two, paddingBottom: Spacing.two, gap: Spacing.one }, composerBox: { minHeight: 48, maxHeight: 140, borderRadius: Radius['2xl'], flexDirection: 'row', alignItems: 'flex-end', paddingLeft: Spacing.three, paddingRight: 5, paddingVertical: 5 }, composerInput: { flex: 1, minHeight: 38, maxHeight: 125, paddingVertical: 7, fontFamily: Fonts.sans, fontSize: 14 }, sendButton: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' }, hint: { textAlign: 'center', fontFamily: Fonts.sans, fontSize: 11 },
  planContent: { width: '100%', maxWidth: 620, alignSelf: 'center', paddingHorizontal: Spacing.three, paddingTop: Spacing.three, paddingBottom: Spacing.four, gap: Spacing.three }, notice: { borderWidth: 1, borderRadius: Radius.xl, padding: Spacing.three }, suggestion: { borderWidth: 1, borderRadius: Radius['2xl'], padding: Spacing.three, gap: Spacing.two }, sectionTitle: { fontFamily: Fonts.headingBold, fontSize: 16 }, smallPrimary: { alignSelf: 'flex-start', minHeight: 38, borderRadius: 19, justifyContent: 'center', paddingHorizontal: Spacing.three }, smallPrimaryText: { fontFamily: Fonts.sansBold, fontSize: 13 }, planHeading: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two }, planTitle: { fontFamily: Fonts.headingBold, fontSize: 20 }, outlineButton: { minHeight: 38, borderRadius: 19, borderWidth: 1, justifyContent: 'center', paddingHorizontal: Spacing.three }, outlineText: { fontFamily: Fonts.sansSemibold, fontSize: 13 }, actions: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  dayList: { gap: Spacing.two, paddingBottom: Spacing.one }, dayChip: { minHeight: 41, paddingHorizontal: Spacing.three, borderWidth: 1, borderRadius: 21, justifyContent: 'center' }, dayText: { fontFamily: Fonts.sansSemibold, fontSize: 13 }, dayBody: { gap: Spacing.three }, dayTitle: { fontFamily: Fonts.headingBold, fontSize: 18 }, mealBlock: { gap: Spacing.two }, mealLabel: { fontFamily: Fonts.sansBold, fontSize: 11, letterSpacing: 1 }, recipeCard: { borderWidth: 1, borderRadius: Radius.xl, minHeight: 52, flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.three, gap: Spacing.two }, recipeTitle: { flex: 1, fontFamily: Fonts.sansSemibold, fontSize: 14 }, emptyMeal: { borderWidth: 1, borderStyle: 'dashed', borderRadius: Radius.xl, padding: Spacing.three, fontFamily: Fonts.sans, fontSize: 13 }, emptyPlan: { borderWidth: 1, borderRadius: Radius['2xl'], padding: Spacing.four, alignItems: 'center', gap: Spacing.two },
  guest: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.four, gap: Spacing.three }, guestSticker: { width: 120, height: 120 }, guestText: { textAlign: 'center', fontFamily: Fonts.sans, fontSize: 14, lineHeight: 21 }, primaryButton: { alignSelf: 'stretch', minHeight: 48, borderRadius: Radius.xl, alignItems: 'center', justifyContent: 'center' }, primaryText: { fontFamily: Fonts.sansBold, fontSize: 15 }, secondaryButton: { alignSelf: 'stretch', minHeight: 46, borderRadius: Radius.xl, borderWidth: 1, alignItems: 'center', justifyContent: 'center' }, secondaryText: { fontFamily: Fonts.sansBold, fontSize: 14 },
});
