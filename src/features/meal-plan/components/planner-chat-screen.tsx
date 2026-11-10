import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useRef } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View, type ScrollViewInstance } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Fonts, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { SproutPet } from '@/features/nutrition-chat/components/sprout-pet';
import { AssistantHeader } from '@/shared/components/chat/assistant-header';
import { CHAT_CONTENT_INSET, ChatBubble, ChatStatus } from '@/shared/components/chat/chat-bubble';
import { ChatComposer } from '@/shared/components/chat/chat-composer';

import { useMealPlanner } from '../hooks/meal-planner-provider';
import { MealRequestForm } from './meal-request-form';

const QUICK_STARTS = [['Lên thực đơn 7 ngày', 'week'], ['Mỗi bữa nấu trong 30 phút', 'quick'], ['Tận dụng nguyên liệu đang có', 'pantry']] as const;
const WELCOME =
  'Chào bạn, mình là trợ lý Vedora. Mình có thể gợi ý món chay theo khẩu vị, thời gian nấu và thực phẩm bạn cần tránh, hoặc lên thực đơn cả tuần. Thực đơn mình đề xuất sẽ hiện ở tab Thực đơn của tôi để bạn xem và lưu.';

/** The signed-in Trợ lý Vedora tab: chat and the request form. Proposals open as a draft in the Thực đơn tab. */
export function PlannerChatScreen() {
  const theme = useTheme();
  const planner = useMealPlanner();
  const { turns, composer, busy, chatError, statuses, latestProposalId, formOpen } = planner;
  const scroll = useRef<ScrollViewInstance>(null);
  const avatar = <SproutPet size={26} accessible={false} />;

  return (
    <SafeAreaView edges={['top']} style={[styles.screen, { backgroundColor: theme.background }]}>
      <AssistantHeader
        avatar={<SproutPet size={38} accessible={false} />}
        title="Trợ lý Vedora"
        subtitle="Hỏi về dinh dưỡng thực vật và lên thực đơn"
      />
      {planner.suggestion ? (
        <Pressable
          accessibilityRole="button"
          onPress={() => planner.previewProposal(planner.suggestion!)}
          style={({ pressed }) => [styles.banner, { backgroundColor: theme.secondary, borderBottomColor: theme.border, opacity: pressed ? 0.8 : 1 }]}>
          <Text style={[styles.bannerText, { color: theme.secondaryForeground }]}>Có thực đơn mới để bạn xem</Text>
          <View style={styles.bannerAction}>
            <Text style={[styles.bannerActionText, { color: theme.primary }]}>Xem ngay</Text>
            <SymbolView name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }} size={14} tintColor={theme.primary} />
          </View>
        </Pressable>
      ) : null}
      <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {formOpen ? (
          <MealRequestForm
            key={planner.formKey}
            restrictions={planner.dietary.data}
            loading={planner.dietary.isPending}
            failed={planner.dietary.isError}
            busy={busy}
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
                  footer={
                    turn.proposal?.id === latestProposalId && !statuses[turn.proposal.id] ? (
                      <Pressable
                        accessibilityRole="button"
                        onPress={() => planner.previewProposal(turn.proposal!)}
                        style={({ pressed }) => [styles.proposal, { backgroundColor: theme.primary, opacity: pressed ? 0.8 : 1 }]}>
                        <Text style={[styles.proposalText, { color: theme.primaryForeground }]}>Xem trong Thực đơn</Text>
                        <SymbolView name={{ ios: 'arrow.right', android: 'arrow_forward', web: 'arrow_forward' }} size={14} tintColor={theme.primaryForeground} />
                      </Pressable>
                    ) : null
                  }
                />
              ))}
              {busy && !turns.some((turn) => turn.streaming) ? <ChatStatus>Trợ lý đang trả lời…</ChatStatus> : null}
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
          hint="Thực đơn chỉ thay đổi sau khi bạn bấm Lưu."
            />
          </>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
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
