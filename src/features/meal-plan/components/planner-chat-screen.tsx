import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View, type ScrollViewInstance } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Fonts, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { SproutPet } from '@/features/nutrition-chat/components/sprout-pet';
import { AssistantHeader } from '@/shared/components/chat/assistant-header';
import { CHAT_CONTENT_INSET, ChatBubble, ChatStatus } from '@/shared/components/chat/chat-bubble';
import { ChatComposer } from '@/shared/components/chat/chat-composer';

import { useMealPlanner, type ChatTurn } from '../hooks/meal-planner-provider';
import { MealRequestForm } from './meal-request-form';
import { PlannerHistorySheet } from './planner-history-sheet';
import { PlannerTrace } from './planner-trace';
import { weekRange } from '../utils/meal-week';
import { traceSteps } from '../utils/planner-trace';
import { savedPlanChanges } from '../utils/planner-changes';

const QUICK_STARTS = [['Lên thực đơn 7 ngày', 'week'], ['Mỗi bữa nấu trong 30 phút', 'quick'], ['Tận dụng nguyên liệu đang có', 'pantry']] as const;
const WELCOME =
  'Chào bạn, mình là trợ lý Vedora. Mình có thể gợi ý món chay theo khẩu vị, thời gian nấu và thực phẩm bạn cần tránh, hoặc lên thực đơn cả tuần. Khi bạn yêu cầu thêm hoặc đổi món, mình sẽ lưu trực tiếp vào tab Thực đơn của tôi.';

/** The assistant writes straight to the saved calendar. */
export function PlannerChatScreen() {
  const theme = useTheme();
  const planner = useMealPlanner();
  const { turns, composer, busy, chatError, formOpen } = planner;
  const scroll = useRef<ScrollViewInstance>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const avatar = <SproutPet size={26} accessible={false} />;

  return (
    <SafeAreaView edges={['top']} style={[styles.screen, { backgroundColor: theme.background }]}>
      <AssistantHeader
        avatar={<SproutPet size={38} accessible={false} />}
        title="Trợ lý Vedora"
        subtitle="Hỏi về dinh dưỡng thực vật và lên thực đơn"
        action={
          <View style={styles.headerActions}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Lịch sử trò chuyện"
              onPress={() => setHistoryOpen(true)}
              hitSlop={8}
              style={({ pressed }) => [styles.newChat, { backgroundColor: theme.muted, opacity: pressed ? 0.7 : 1 }]}>
              <SymbolView name={{ ios: 'clock.arrow.circlepath', android: 'history', web: 'history' }} size={18} tintColor={theme.foreground} />
            </Pressable>
            {turns.length > 0 ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Cuộc trò chuyện mới"
                accessibilityHint="Cuộc trò chuyện hiện tại vẫn được lưu"
                disabled={busy}
                onPress={planner.startNewChat}
                hitSlop={8}
                style={({ pressed }) => [styles.newChat, { backgroundColor: theme.muted, opacity: busy ? 0.4 : pressed ? 0.7 : 1 }]}>
                <SymbolView name={{ ios: 'square.and.pencil', android: 'edit_square', web: 'edit_square' }} size={18} tintColor={theme.foreground} />
              </Pressable>
            ) : null}
          </View>
        }
      />
      <PlannerHistorySheet open={historyOpen} onClose={() => setHistoryOpen(false)} />
      <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {formOpen ? (
          <MealRequestForm
            key={planner.formKey}
            restrictions={planner.dietary.data}
            loading={planner.dietary.isPending}
            failed={planner.dietary.isError}
            busy={busy}
            weekStart={planner.weekStart}
            weeks={planner.weeks}
            onWeekChange={planner.changeWeek}
            retry={() => void planner.dietary.refetch()}
            onClose={() => planner.setFormOpen(false)}
            onSubmit={(prompt) => {
              planner.setFormOpen(false);
              void planner.sendMessage(prompt);
            }}
            onReview={(prompt) => {
              planner.setComposer(prompt);
              planner.setFormOpen(false);
            }}
            seed={planner.preset}
          />
        ) : (
          <>
            <ScrollView
              ref={scroll}
              style={styles.screen}
              contentContainerStyle={styles.content}
              keyboardShouldPersistTaps="handled"
              onContentSizeChange={() => scroll.current?.scrollToEnd({ animated: true })}>
              <>
              <ChatBubble role="assistant" text={WELCOME} authorLabel="Trợ lý Vedora" avatar={avatar} />
              {turns.length === 0 ? (
                <View style={styles.quickList}>
                  <Text style={[styles.quickLabel, { color: theme.mutedForeground }]}>BẮT ĐẦU NHANH</Text>
                  {QUICK_STARTS.map(([label, choice]) => (
                    <QuickChip key={label} label={label} onPress={() => planner.startForm(choice)} />
                  ))}
                  <QuickChip label="Hỏi về nguyên liệu và dinh dưỡng" onPress={() => planner.setComposer('Mình muốn hỏi về nguyên liệu và dinh dưỡng.')} />
                </View>
              ) : null}
              {turns.map((turn) => (
                <ChatBubble
                  key={turn.id}
                  role={turn.role === 'user' ? 'user' : 'assistant'}
                  text={turn.text}
                  streaming={turn.streaming}
                  authorLabel="Trợ lý Vedora"
                  avatar={avatar}
                  header={turn.toolParts ? <TurnTrace turn={turn} /> : null}
                  footer={
                    [...new Set(savedPlanChanges((turn.toolParts ?? []).map((part) => ({ name: part.type, callId: part.toolCallId, output: part.output }))).map((change) => change.weekStart))].map((week) => (
                      <Pressable key={week} accessibilityRole="button" onPress={() => planner.showSavedWeek(week)}
                        disabled={!planner.weeks.includes(week)}
                        style={({ pressed }) => [styles.proposal, { backgroundColor: theme.secondary, opacity: pressed ? 0.8 : 1 }]}>
                        <Text style={[styles.proposalText, { color: theme.primary }]}>Đã lưu · Xem thực đơn {weekRange(week)}</Text>
                      </Pressable>
                    ))
                  }
                />
              ))}
              {busy && !turns.some((turn) => turn.streaming) ? <ChatStatus>Đang suy nghĩ…</ChatStatus> : null}
              {chatError ? (
                <Text accessibilityRole="alert" style={[styles.error, { color: theme.destructive }]}>
                  {chatError}
                </Text>
              ) : null}
              {chatError.includes('đăng nhập') ? (
                <Pressable accessibilityRole="button" onPress={() => router.push({ pathname: '/login', params: { returnTo: '/ai' } })} style={styles.relogin}>
                  <Text style={[styles.link, { color: theme.primary }]}>Đăng nhập lại</Text>
                </Pressable>
              ) : null}
              </>
            </ScrollView>
            <ChatComposer
          value={composer}
          onChangeText={(value) => {
            planner.setComposer(value);
            planner.setChatError('');
          }}
          onSubmit={() => void planner.sendMessage()}
          placeholder="Hỏi về món chay hoặc yêu cầu đổi món…"
          inputLabel="Hỏi hoặc yêu cầu đổi món"
          sendLabel="Gửi yêu cầu"
          sendDisabled={busy}
          maxLength={4000}
          hint="Yêu cầu thêm hoặc đổi món sẽ được lưu trực tiếp vào thực đơn."
            />
          </>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function TurnTrace({ turn }: { turn: ChatTurn }) {
  const steps = traceSteps(turn.toolParts ?? [], !turn.streaming);
  const thinking = !!turn.streaming && !turn.text && !steps.some((step) => step.status === 'running');
  return <PlannerTrace steps={steps} thinking={thinking} />;
}

function QuickChip({ label, onPress }: { label: string; onPress: () => void }) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.quickChip, { borderColor: theme.border, backgroundColor: theme.card, opacity: pressed ? 0.72 : 1 }]}>
      <Text style={[styles.quickText, { color: theme.foreground }]}>{label}</Text>
      <SymbolView name={{ ios: 'arrow.up.left', android: 'north_west', web: 'north_west' }} size={15} tintColor={theme.mutedForeground} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  headerActions: { flexDirection: 'row', gap: Spacing.two },
  newChat: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  banner: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  bannerText: { flex: 1, fontFamily: Fonts.sansMedium, fontSize: 13, lineHeight: 18 },
  bannerAction: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one },
  bannerActionText: { fontFamily: Fonts.sansBold, fontSize: 13, lineHeight: 18 },
  content: { width: '100%', maxWidth: 680, alignSelf: 'center', padding: Spacing.three, paddingBottom: Spacing.four, gap: Spacing.three },
  quickList: { paddingLeft: CHAT_CONTENT_INSET, gap: Spacing.two },
  quickLabel: { fontFamily: Fonts.sansBold, fontSize: 11, lineHeight: 16, letterSpacing: 1.1 },
  quickChip: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
    borderWidth: 1,
    borderRadius: Radius['2xl'],
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  quickText: { flex: 1, fontFamily: Fonts.sans, fontSize: 14, lineHeight: 20 },
  proposal: {
    minHeight: 40,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderRadius: Radius.xl,
    paddingHorizontal: Spacing.three,
  },
  proposalText: { fontFamily: Fonts.sansBold, fontSize: 13, lineHeight: 18 },
  error: { paddingLeft: CHAT_CONTENT_INSET, fontFamily: Fonts.sansMedium, fontSize: 13, lineHeight: 19 },
  relogin: { alignSelf: 'flex-start', minHeight: 36, justifyContent: 'center', marginLeft: CHAT_CONTENT_INSET },
  link: { fontFamily: Fonts.sansBold, fontSize: 13, lineHeight: 18 },
});
