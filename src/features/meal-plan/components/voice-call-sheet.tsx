import { useCallback, useEffect, useRef, type RefObject } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, View, type ScrollViewInstance } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SymbolView } from 'expo-symbols';
import { SproutPet } from '@/features/nutrition-chat/components/sprout-pet';
import { useTheme } from '@/hooks/use-theme';
import { Fonts, Radius, Spacing } from '@/constants/theme';
import { NutritionSection } from '@/features/dietary-profile/components/nutrition-section';
import { MealLogScreen } from '@/features/meal-log/components/meal-log-screen';
import { useRecipe } from '@/features/recipes/hooks/use-recipes';
import { formatIngredient } from '@/features/recipes/utils/recipe-format';
import type { MealPlanner } from '../hooks/meal-planner-provider';
import { useMealPlan } from '../hooks/use-meal-plan';
import type { VoiceStatus } from '../services/voice-call';
import { useMealPlannerVoice } from '../hooks/use-meal-planner-voice';
import type { VoiceFocus, VoiceScreen } from '../types/voice.schema';
import { dayLabels, sectionLabels } from '../utils/meal-plan';
import { weekRange } from '../utils/meal-week';

const STATUS: Record<VoiceStatus, string> = { connecting: 'Đang kết nối…', listening: 'Mình đang nghe bạn', speaking: 'Vedora đang nói', thinking: 'Đang xử lý yêu cầu…', muted: 'Mic đang tắt', ending: 'Đang chào tạm biệt…', ended: 'Cuộc gọi đã kết thúc', error: 'Chưa thể tiếp tục cuộc gọi' };

export function VoiceCallSheet({ planner, onClose }: { planner: MealPlanner; onClose: () => void }) {
  const theme = useTheme();
  const { screen, focus, status, error, reply, heard, elapsed, finished, sendContext, scrollRef, scrollProps, closePanel, end, toggleMute, applyScreen, selectDay, setLogDate, retry } = useMealPlannerVoice(planner);
  const token = planner.token;
  const close = () => { end(); onClose(); };
  return <Modal visible animationType="slide" presentationStyle="fullScreen" onRequestClose={close}>
    <SafeAreaView style={[styles.screen, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <View style={[styles.callAvatar, { backgroundColor: theme.secondary }]}><SproutPet size={38} accessible={false} /></View>
        <View style={styles.flex}>
          <Text accessibilityRole="header" style={[styles.title, { color: theme.foreground }]}>Vedora Voice</Text>
          <Text style={[styles.caption, { color: theme.mutedForeground }]}>Trợ lý món chay của bạn</Text>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel="Đóng cuộc gọi" onPress={close} style={styles.control}><SymbolView name={{ ios: 'xmark', android: 'close', web: 'close' }} size={22} tintColor={theme.foreground} /></Pressable>
      </View>
      {screen.panel === 'eatingLog' ? <MealLogScreen key={focus?.kind === 'eatingLog' ? focus.date : 'log'} initialDate={screen.eatingLogDate} onClose={closePanel} scrollRef={scrollRef} scrollProps={scrollProps} onDateChange={setLogDate} />
        : <ScrollView key={screen.panel === 'recipe' ? screen.recipeId : screen.panel} ref={scrollRef} {...scrollProps} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
          {screen.panel !== 'none' ? <Pressable accessibilityRole="button" onPress={closePanel} style={[styles.closePanel, { borderColor: theme.border }]}><Text style={[styles.label, { color: theme.primary }]}>Về thực đơn</Text></Pressable> : null}
          {screen.panel === 'recipe' && focus?.kind === 'recipe' ? <VoiceRecipe focus={focus} scrollRef={scrollRef} onContext={sendContext} onStep={(step) => applyScreen({ close: null, focus: { ...focus, step, section: 'steps' } })} />
            : screen.panel === 'bodyMetrics' && token ? <NutritionSection token={token} />
              : <VoiceCalendar screen={screen} token={token} onDay={selectDay} onRecipe={(id, title) => applyScreen({ close: null, focus: { kind: 'recipe', recipeId: id, title, section: 'top' } })} />}
        </ScrollView>}
      <View style={[styles.footer, { backgroundColor: theme.card, borderTopColor: theme.border }]}>
        <View style={styles.callStatus}>
          <View style={[styles.statusPill, { backgroundColor: theme.secondary }]}>
            {status === 'connecting' ? <ActivityIndicator size="small" color={theme.primary} /> : <SymbolView name={status === 'muted' ? { ios: 'mic.slash', android: 'mic_off', web: 'mic_off' } : { ios: 'waveform', android: 'graphic_eq', web: 'graphic_eq' }} size={18} tintColor={theme.primary} />}
            <Text accessibilityLiveRegion="polite" style={[styles.label, { color: theme.secondaryForeground }]}>{STATUS[status]}</Text>
          </View>
          <Text accessibilityLabel={`Thời gian cuộc gọi ${Math.floor(elapsed / 60)} phút ${elapsed % 60} giây`} style={[styles.timer, { color: theme.mutedForeground }]}>{Math.floor(elapsed / 60)}:{String(elapsed % 60).padStart(2, '0')}</Text>
        </View>
        {error ? <Text accessibilityRole="alert" style={[styles.text, { color: theme.destructive }]}>{error}</Text> : null}
        {(heard || reply) ? <View style={[styles.transcript, { backgroundColor: theme.muted }]}>
          {heard ? <Text numberOfLines={2} style={[styles.text, { color: theme.mutedForeground }]}>Bạn: {heard}</Text> : null}
          {reply ? <Text numberOfLines={3} accessibilityLiveRegion="polite" style={[styles.text, { color: theme.foreground }]}>{reply}</Text> : null}
        </View> : null}
        <View style={styles.callActions}>
          <View style={styles.callAction}>
          {finished ? <Pressable accessibilityRole="button" accessibilityLabel="Gọi lại" onPress={retry} style={[styles.roundButton, { backgroundColor: theme.primary }]}><SymbolView name={{ ios: 'arrow.clockwise', android: 'refresh', web: 'refresh' }} size={25} tintColor={theme.primaryForeground} /></Pressable>
            : <Pressable accessibilityRole="button" accessibilityLabel={status === 'muted' ? 'Bật mic' : 'Tắt mic'} accessibilityState={{ disabled: status === 'connecting' }} disabled={status === 'connecting'} onPress={toggleMute} style={[styles.roundButton, { backgroundColor: status === 'muted' ? theme.muted : theme.secondary, opacity: status === 'connecting' ? 0.4 : 1 }]}><SymbolView name={status === 'muted' ? { ios: 'mic.slash.fill', android: 'mic_off', web: 'mic_off' } : { ios: 'mic.fill', android: 'mic', web: 'mic' }} size={25} tintColor={theme.primary} /></Pressable>}
          <Text style={[styles.caption, { color: theme.foreground }]}>{finished ? 'Gọi lại' : status === 'muted' ? 'Bật mic' : 'Tắt mic'}</Text>
          </View>
          <View style={styles.callAction}>
          <Pressable accessibilityRole="button" accessibilityLabel={finished ? 'Đóng cuộc gọi' : 'Kết thúc cuộc gọi'} onPress={close} style={[styles.roundButton, { backgroundColor: theme.destructive }]}><SymbolView name={finished ? { ios: 'xmark', android: 'close', web: 'close' } : { ios: 'phone.down.fill', android: 'call_end', web: 'call_end' }} size={25} tintColor="#fff" /></Pressable>
          <Text style={[styles.caption, { color: theme.foreground }]}>{finished ? 'Đóng' : 'Kết thúc'}</Text>
          </View>
        </View>
        <Text style={[styles.caption, styles.callHint, { color: theme.mutedForeground }]}>Tối đa 5 phút · Thay đổi được lưu như khi chat</Text>
      </View>
    </SafeAreaView>
  </Modal>;
}

function VoiceCalendar({ screen, token, onDay, onRecipe }: { screen: VoiceScreen; token: string | null; onDay: (day: NonNullable<VoiceScreen['day']>) => void; onRecipe: (id: string, title: string) => void }) {
  const theme = useTheme();
  const plan = useMealPlan(token, screen.weekStart);
  return <>
    <Text style={[styles.title, { color: theme.foreground }]}>{weekRange(screen.weekStart)}</Text>
    {plan.isPending ? <ActivityIndicator color={theme.primary} /> : null}
    {plan.isError ? <Pressable accessibilityRole="button" onPress={() => void plan.refetch()}><Text style={[styles.text, { color: theme.destructive }]}>Chưa tải được thực đơn. Chạm để thử lại.</Text></Pressable> : null}
    {plan.data?.days.filter((day) => !screen.day || day.day === screen.day).map((day) => <View key={day.day} style={[styles.card, { borderColor: theme.border }]}>
      <Text style={[styles.title, { color: theme.foreground }]}>{dayLabels[day.day]}</Text>
      {day.sections.map((section) => <View key={section.section} style={styles.section}>
        <Text style={[styles.label, { color: theme.mutedForeground }]}>{sectionLabels[section.section]}</Text>
        {section.recipes.map((recipe) => <Pressable key={recipe.id} accessibilityRole="button" onPress={() => onRecipe(recipe.id, recipe.title)}><Text style={[styles.text, { color: theme.primary }]}>{recipe.title}</Text></Pressable>)}
        {!section.recipes.length ? <Text style={[styles.text, { color: theme.mutedForeground }]}>Chưa có món</Text> : null}
      </View>)}
    </View>)}
    <View style={styles.actions}>{plan.data?.days.map((day) => <Pressable key={day.day} accessibilityRole="button" accessibilityLabel={dayLabels[day.day]} onPress={() => onDay(day.day)} style={styles.control}><Text style={[styles.label, { color: theme.primary }]}>{dayLabels[day.day].replace('Thứ ', 'T')}</Text></Pressable>)}</View>
  </>;
}

function VoiceRecipe({ focus, scrollRef, onContext, onStep }: { focus: Extract<VoiceFocus, { kind: 'recipe' }>; scrollRef: RefObject<ScrollViewInstance | null>; onContext: (text: string) => void; onStep: (step: number) => void }) {
  const theme = useTheme();
  const recipe = useRecipe(focus.recipeId);
  const offsets = useRef<Record<string, number>>({ top: 0 });
  const contentOffset = useRef(0);
  const desired = focus.step ? `step-${focus.step}` : focus.section ?? 'top';
  const go = useCallback(() => { if (offsets.current[desired] !== undefined) scrollRef.current?.scrollTo({ y: contentOffset.current + offsets.current[desired], animated: true }); }, [desired, scrollRef]);
  useEffect(() => { go(); }, [go]);
  useEffect(() => {
    if (recipe.data) onContext(`Công thức đang mở: ${recipe.data.title}, ${recipe.data.servings} khẩu phần. Nguyên liệu: ${recipe.data.ingredients.map(formatIngredient).join(', ')}. Các bước: ${recipe.data.steps.map((step, index) => `${index + 1}. ${step}`).join(' ')}`);
  }, [onContext, recipe.data]);
  if (recipe.isPending) return <ActivityIndicator color={theme.primary} />;
  if (!recipe.data) return <Pressable accessibilityRole="button" onPress={() => void recipe.refetch()}><Text style={[styles.text, { color: theme.destructive }]}>Chưa tải được công thức. Chạm để thử lại.</Text></Pressable>;
  const data = recipe.data;
  return <View style={styles.section} onLayout={(event) => { contentOffset.current = event.nativeEvent.layout.y; go(); }}>
    <Text style={[styles.title, { color: theme.foreground }]}>{data.title}</Text>
    <Text style={[styles.text, { color: theme.mutedForeground }]}>{data.servings} khẩu phần</Text>
    <Text onLayout={(event) => { offsets.current.ingredients = event.nativeEvent.layout.y; go(); }} style={[styles.title, { color: theme.foreground }]}>Nguyên liệu</Text>
    {data.ingredients.map((item) => <Text key={item.ingredientId} style={[styles.text, { color: theme.foreground }]}>• {formatIngredient(item)}</Text>)}
    <Text onLayout={(event) => { offsets.current.steps = event.nativeEvent.layout.y; go(); }} style={[styles.title, { color: theme.foreground }]}>Từng bước vào bếp</Text>
    {data.steps.map((step, index) => <View key={index} onLayout={(event) => { offsets.current[`step-${index + 1}`] = event.nativeEvent.layout.y; go(); }} style={[styles.card, { borderColor: focus.step === index + 1 ? theme.primary : theme.border, backgroundColor: focus.step === index + 1 ? theme.secondary : theme.card }]}>
      <Pressable accessibilityRole="button" accessibilityLabel={`Xem bước ${index + 1}`} onPress={() => onStep(index + 1)}><Text style={[styles.label, { color: theme.primary }]}>Bước {index + 1}</Text></Pressable>
      <Text style={[styles.text, { color: theme.foreground }]}>{step}</Text>
    </View>)}
  </View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1 }, flex: { flex: 1 }, header: { flexDirection: 'row', alignItems: 'center', padding: Spacing.three, gap: Spacing.two, borderBottomWidth: StyleSheet.hairlineWidth },
  title: { fontFamily: Fonts.headingBold, fontSize: 18, lineHeight: 26 }, text: { fontFamily: Fonts.sans, fontSize: 14, lineHeight: 21 }, label: { fontFamily: Fonts.sansBold, fontSize: 14 }, caption: { fontFamily: Fonts.sans, fontSize: 11, lineHeight: 16 },
  content: { padding: Spacing.three, gap: Spacing.three }, section: { gap: Spacing.two }, card: { borderWidth: 1, borderRadius: Radius.xl, padding: Spacing.three, gap: Spacing.two },
  control: { minWidth: 40, minHeight: 44, alignItems: 'center', justifyContent: 'center' }, closePanel: { borderWidth: 1, borderRadius: Radius.xl, padding: Spacing.three, alignItems: 'center' },
  footer: { padding: Spacing.three, gap: 12, borderTopWidth: StyleSheet.hairlineWidth, borderTopLeftRadius: 24, borderTopRightRadius: 24 }, actions: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two, alignItems: 'center' },
  callAvatar: { width: 52, height: 52, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  callStatus: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  statusPill: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, flexShrink: 1 },
  timer: { fontFamily: Fonts.mono, fontSize: 13 },
  transcript: { padding: 14, borderRadius: 16, gap: 8 },
  callActions: { flexDirection: 'row', justifyContent: 'center', gap: 40, paddingVertical: 4 },
  callAction: { alignItems: 'center', gap: 7 },
  roundButton: { width: 58, height: 58, borderRadius: 29, alignItems: 'center', justifyContent: 'center' },
  callHint: { textAlign: 'center' },
});
