import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useRef } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Fonts, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { useMealPlanner } from '../hooks/meal-planner-provider';
import { MealRequestForm } from './meal-request-form';

const QUICK_STARTS = [['Lên thực đơn 7 ngày', 'week'], ['Mỗi bữa nấu trong 30 phút', 'quick'], ['Tận dụng nguyên liệu đang có', 'pantry']] as const;

/** The signed-in Trợ lý Vedora tab: chat and the request form. Proposals open as a draft in the Thực đơn tab. */
export function PlannerChatScreen() {
  const theme = useTheme();
  const planner = useMealPlanner();
  const { turns, composer, busy, chatError, statuses, latestProposalId, formOpen } = planner;
  const scroll = useRef<ScrollView>(null);

  return <SafeAreaView edges={['top']} style={[styles.screen, { backgroundColor: theme.background }]}>
    <View style={[styles.header, { backgroundColor: theme.background, borderBottomColor: theme.border }]}>
      <View style={styles.headerText}>
        <Text style={[styles.title, { color: theme.foreground }]}>Trợ lý Vedora</Text>
        <Text style={[styles.subtitle, { color: theme.mutedForeground }]}>Hỏi về dinh dưỡng thực vật và lên thực đơn</Text>
      </View>
      {planner.suggestion ? <Pressable accessibilityRole="button" onPress={() => planner.previewProposal(planner.suggestion!)} style={[styles.smallPrimary, { backgroundColor: theme.primary }]}>
        <Text style={[styles.smallPrimaryText, { color: theme.primaryForeground }]}>Xem thực đơn mới</Text>
      </Pressable> : null}
    </View>
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView ref={scroll} style={styles.flex} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" onContentSizeChange={() => scroll.current?.scrollToEnd({ animated: true })}>
        {formOpen ? <View style={styles.form}>
          <Pressable accessibilityRole="button" onPress={() => planner.setFormOpen(false)} style={styles.closeForm}>
            <Text style={[styles.link, { color: theme.primary }]}>Quay lại trò chuyện</Text>
          </Pressable>
          <MealRequestForm key={planner.formKey} restrictions={planner.dietary.data} loading={planner.dietary.isPending} failed={planner.dietary.isError} retry={() => void planner.dietary.refetch()} onContinue={(prompt) => { planner.setComposer(prompt); planner.setFormOpen(false); }} seed={planner.preset} />
        </View> : <>
          <View style={styles.assistantRow}><View style={[styles.assistantMark, { backgroundColor: theme.primary }]}><Text style={styles.markText}>V</Text></View><Text style={[styles.assistantName, { color: theme.foreground }]}>Trợ lý Vedora</Text></View>
          <Text style={[styles.welcome, { color: theme.foreground }]}>Bạn muốn lên thực đơn hay tìm hiểu thêm về món chay? Mình có thể giúp chọn món theo sở thích, thời gian nấu và thành phần cần tránh. Thực đơn mình đề xuất sẽ hiện ở tab Lên thực đơn để bạn xem và lưu.</Text>
          {turns.length === 0 ? <View style={styles.quickList}>
            {QUICK_STARTS.map(([label, choice]) => <Pressable key={label} accessibilityRole="button" onPress={() => planner.startForm(choice)} style={[styles.quickChip, { borderColor: theme.border, backgroundColor: theme.card }]}><Text style={[styles.quickText, { color: theme.foreground }]}>{label}</Text></Pressable>)}
            <Pressable accessibilityRole="button" onPress={() => planner.setComposer('Mình muốn hỏi về nguyên liệu và dinh dưỡng.')} style={[styles.quickChip, { borderColor: theme.border, backgroundColor: theme.card }]}><Text style={[styles.quickText, { color: theme.foreground }]}>Hỏi về nguyên liệu và dinh dưỡng</Text></Pressable>
          </View> : null}
          {turns.map((turn) => <View key={turn.id} style={[styles.bubble, turn.role === 'user' ? styles.userBubble : styles.aiBubble, { borderColor: theme.border, backgroundColor: turn.role === 'user' ? theme.secondary : theme.card }]}>
            <Text style={[styles.bubbleBy, { color: theme.primary }]}>{turn.role === 'user' ? 'Bạn' : 'Trợ lý Vedora'}</Text>
            <Text style={[styles.bubbleText, { color: theme.foreground }]}>{turn.text}{turn.streaming ? ' ▍' : ''}</Text>
            {turn.proposal?.id === latestProposalId && !statuses[turn.proposal.id] ? <Pressable accessibilityRole="button" onPress={() => planner.previewProposal(turn.proposal!)} style={[styles.smallPrimary, { backgroundColor: theme.primary }]}><Text style={[styles.smallPrimaryText, { color: theme.primaryForeground }]}>Xem trong Thực đơn  →</Text></Pressable> : null}
          </View>)}
          {busy && !turns.some((turn) => turn.streaming) ? <View style={styles.loadingRow}><ActivityIndicator size="small" color={theme.primary} /><Text style={[styles.helper, { color: theme.mutedForeground }]}>Trợ lý đang trả lời…</Text></View> : null}
          {chatError ? <Text accessibilityRole="alert" style={[styles.error, { color: theme.destructive }]}>{chatError}</Text> : null}
          {chatError.includes('đăng nhập') ? <Pressable accessibilityRole="button" onPress={() => router.push({ pathname: '/login', params: { returnTo: '/ai' } })}><Text style={[styles.link, { color: theme.primary }]}>Đăng nhập lại</Text></Pressable> : null}
        </>}
      </ScrollView>
      <View style={[styles.composerWrap, { backgroundColor: theme.card, borderTopColor: theme.border }]}>
        <View style={[styles.composerBox, { backgroundColor: theme.muted }]}>
          <TextInput accessibilityLabel="Hỏi hoặc yêu cầu đổi món" value={composer} onChangeText={(value) => { planner.setComposer(value); planner.setChatError(''); }} onFocus={() => planner.setFormOpen(false)} multiline maxLength={4000} placeholder="Hỏi về món chay hoặc yêu cầu đổi món…" placeholderTextColor={theme.mutedForeground} style={[styles.composerInput, { color: theme.foreground }]} />
          <Pressable accessibilityRole="button" accessibilityLabel="Gửi yêu cầu" accessibilityState={{ disabled: busy }} disabled={busy} onPress={() => void planner.sendMessage()} style={[styles.sendButton, { backgroundColor: busy ? theme.mutedForeground : theme.primary }]}><SymbolView name={{ ios: 'arrow.up', android: 'arrow_upward', web: 'arrow_upward' }} size={19} tintColor={theme.primaryForeground} /></Pressable>
        </View>
        <Text style={[styles.hint, { color: theme.mutedForeground }]}>Đề xuất chỉ thay đổi thực đơn sau khi bạn lưu.</Text>
      </View>
    </KeyboardAvoidingView>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  screen: { flex: 1 }, flex: { flex: 1 },
  header: { minHeight: 64, borderBottomWidth: 1, paddingHorizontal: Spacing.three, paddingVertical: Spacing.two, flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  headerText: { flex: 1 }, title: { fontFamily: Fonts.headingBold, fontSize: 20, lineHeight: 28 }, subtitle: { fontFamily: Fonts.sans, fontSize: 12, lineHeight: 18 },
  content: { width: '100%', maxWidth: 620, alignSelf: 'center', padding: Spacing.three, paddingBottom: Spacing.four, gap: Spacing.three },
  form: { gap: Spacing.two }, closeForm: { alignSelf: 'flex-start', minHeight: 36, justifyContent: 'center' },
  assistantRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two }, assistantMark: { width: 31, height: 31, borderRadius: 16, alignItems: 'center', justifyContent: 'center' }, markText: { color: '#fffefa', fontFamily: Fonts.headingBold, fontSize: 17 }, assistantName: { fontFamily: Fonts.sansBold, fontSize: 14 }, welcome: { fontFamily: Fonts.sans, fontSize: 15, lineHeight: 23 },
  quickList: { alignItems: 'flex-start', gap: Spacing.two, marginTop: Spacing.two }, quickChip: { borderWidth: 1, borderRadius: 24, minHeight: 42, justifyContent: 'center', paddingHorizontal: Spacing.three }, quickText: { fontFamily: Fonts.sans, fontSize: 14 },
  bubble: { maxWidth: '94%', padding: Spacing.three, borderWidth: 1, borderRadius: Radius['2xl'], gap: Spacing.one }, userBubble: { alignSelf: 'flex-end' }, aiBubble: { alignSelf: 'flex-start' }, bubbleBy: { fontFamily: Fonts.sansBold, fontSize: 12 }, bubbleText: { fontFamily: Fonts.sans, fontSize: 14, lineHeight: 21 },
  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, paddingVertical: Spacing.two }, helper: { fontFamily: Fonts.sans, fontSize: 13, lineHeight: 19 }, error: { fontFamily: Fonts.sansMedium, fontSize: 13, lineHeight: 19 }, link: { fontFamily: Fonts.sansBold, fontSize: 13 },
  smallPrimary: { alignSelf: 'flex-start', minHeight: 38, borderRadius: 19, justifyContent: 'center', paddingHorizontal: Spacing.three }, smallPrimaryText: { fontFamily: Fonts.sansBold, fontSize: 13 },
  composerWrap: { borderTopWidth: 1, paddingHorizontal: Spacing.three, paddingTop: Spacing.two, paddingBottom: Spacing.two, gap: Spacing.one }, composerBox: { minHeight: 48, maxHeight: 140, borderRadius: Radius['2xl'], flexDirection: 'row', alignItems: 'flex-end', paddingLeft: Spacing.three, paddingRight: 5, paddingVertical: 5 }, composerInput: { flex: 1, minHeight: 38, maxHeight: 125, paddingVertical: 7, fontFamily: Fonts.sans, fontSize: 14 }, sendButton: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' }, hint: { textAlign: 'center', fontFamily: Fonts.sans, fontSize: 11 },
});
