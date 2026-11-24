import { useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Fonts, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import type { PlannerQuestion, PlannerWebRequest } from '../utils/planner-interactions';

export function PlannerQuestionCard({ question, open, onAnswer }: { question: PlannerQuestion; open: boolean; onAnswer: (answer: string) => void }) {
  const theme = useTheme();
  const [picked, setPicked] = useState<string[]>([]);
  function choose(option: string) {
    if (!open) return;
    if (!question.multiple) { onAnswer(option); return; }
    setPicked((old) => old.includes(option) ? old.filter((item) => item !== option) : [...old, option]);
  }
  return <View accessibilityLabel="Câu hỏi của trợ lý" style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
    <Text style={[styles.title, { color: theme.foreground }]}>{question.question}</Text>
    {question.options.map((option, index) => {
      const selected = picked.includes(option) || question.answer === option;
      return <Pressable key={index} accessibilityRole={question.multiple ? 'checkbox' : 'button'}
        accessibilityState={{ disabled: !open, ...(question.multiple ? { checked: selected } : {}) }}
        disabled={!open} onPress={() => choose(option)}
        style={[styles.button, { borderColor: selected ? theme.primary : theme.border, backgroundColor: selected ? theme.secondary : theme.card, opacity: open ? 1 : 0.65 }]}>
        <Text style={[styles.text, { color: selected ? theme.primary : theme.foreground }]}>{question.multiple ? `${selected ? '☑' : '☐'} ` : ''}{option}</Text>
      </Pressable>;
    })}
    {question.multiple && open ? <Pressable accessibilityRole="button" disabled={!picked.length} accessibilityState={{ disabled: !picked.length }}
      onPress={() => { if (picked.length) onAnswer(picked.join(', ')); }} style={[styles.button, { backgroundColor: theme.primary, borderColor: theme.primary, opacity: picked.length ? 1 : 0.5 }]}>
      <Text style={[styles.title, { color: theme.primaryForeground }]}>Gửi lựa chọn</Text>
    </Pressable> : null}
    <Text selectable style={[styles.hint, { color: theme.mutedForeground }]}>{question.answer ? `Đã trả lời: ${question.answer}` : open ? 'Hoặc nhập câu trả lời khác ở ô bên dưới.' : 'Câu hỏi trước đó · Chỉ câu hỏi mới nhất có thể trả lời.'}</Text>
  </View>;
}

export function PlannerWebConsentCard({ request, open, onAnswer }: { request: PlannerWebRequest; open: boolean; onAnswer: (approved: boolean) => void }) {
  const theme = useTheme();
  return <View accessibilityLabel="Quyền tìm kiếm trên web" style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
    <Text style={[styles.title, { color: theme.foreground }]}>Cho phép tìm trên web?</Text>
    <Text selectable style={[styles.text, { color: theme.foreground }]}>{request.reason}</Text>
    <Text style={[styles.hint, { color: theme.mutedForeground }]}>Quyền áp dụng cho cuộc trò chuyện này. Cuộc trò chuyện mới sẽ hỏi lại trước khi tìm web.</Text>
    {request.approved === undefined ? <>
      <Pressable accessibilityRole="button" disabled={!open} accessibilityState={{ disabled: !open }} onPress={() => { if (open) onAnswer(true); }} style={[styles.button, { backgroundColor: theme.primary, borderColor: theme.primary, opacity: open ? 1 : 0.5 }]}>
        <Text style={[styles.title, { color: theme.primaryForeground }]}>Cho phép tìm web</Text>
      </Pressable>
      <Pressable accessibilityRole="button" disabled={!open} accessibilityState={{ disabled: !open }} onPress={() => { if (open) onAnswer(false); }} style={[styles.button, { borderColor: theme.border, opacity: open ? 1 : 0.5 }]}>
        <Text style={[styles.text, { color: theme.foreground }]}>Tiếp tục không dùng web</Text>
      </Pressable>
    </> : <Text style={[styles.hint, { color: theme.primary }]}>{request.approved ? 'Bạn đã cho phép tìm web.' : 'Bạn đã chọn tiếp tục không dùng web.'}</Text>}
    {!open && request.approved === undefined ? <Text style={[styles.hint, { color: theme.mutedForeground }]}>Yêu cầu trước đó · Không còn chờ trả lời.</Text> : null}
  </View>;
}

export function PlannerRewindDialog({ text, hasComposer, busy, error, onCancel, onConfirm }: { text: string | null; hasComposer: boolean; busy: boolean; error: string; onCancel: () => void; onConfirm: () => void }) {
  const theme = useTheme();
  return <Modal visible={text !== null} transparent animationType="fade" onRequestClose={() => { if (!busy) onCancel(); }}>
    <View style={styles.overlay}><View accessibilityViewIsModal style={[styles.dialog, { backgroundColor: theme.card }]}>
      <ScrollView contentContainerStyle={styles.dialogContent}>
        <Text accessibilityRole="header" style={[styles.title, { color: theme.foreground }]}>Hoàn tác từ tin nhắn này?</Text>
        <Text style={[styles.text, { color: theme.foreground }]}>{text?.slice(0, 180)}</Text>
        <Text style={[styles.text, { color: theme.mutedForeground }]}>Thực đơn sẽ trở về trước yêu cầu này. Tin nhắn này và mọi tin nhắn sau nó sẽ bị xóa khỏi cuộc trò chuyện. Ngày đã qua giữ nguyên; món đã xóa hoặc nay cần kiêng có thể không được khôi phục.</Text>
        <Text style={[styles.hint, { color: theme.mutedForeground }]}>{hasComposer ? 'Nội dung đang nhập sẽ được thay bằng tin nhắn này để bạn sửa và gửi lại.' : 'Tin nhắn này được đưa lại vào ô nhập để bạn sửa và gửi lại.'}</Text>
        {error ? <Text accessibilityRole="alert" style={[styles.text, { color: theme.destructive }]}>{error}</Text> : null}
        {busy ? <View style={styles.progress}><ActivityIndicator color={theme.primary} /><Text style={[styles.text, { color: theme.foreground }]}>Đang hoàn tác…</Text></View> : null}
        <Pressable accessibilityRole="button" disabled={busy} onPress={onConfirm} style={[styles.button, { backgroundColor: theme.primary, borderColor: theme.primary, opacity: busy ? 0.5 : 1 }]}><Text style={[styles.title, { color: theme.primaryForeground }]}>Xác nhận hoàn tác</Text></Pressable>
        <Pressable accessibilityRole="button" disabled={busy} onPress={onCancel} style={[styles.button, { borderColor: theme.border, opacity: busy ? 0.5 : 1 }]}><Text style={[styles.text, { color: theme.foreground }]}>Hủy</Text></Pressable>
      </ScrollView>
    </View></View>
  </Modal>;
}

const styles = StyleSheet.create({
  card: { width: '100%', borderWidth: 1, borderRadius: Radius.xl, padding: Spacing.three, gap: Spacing.two },
  title: { fontFamily: Fonts.sansBold, fontSize: 15, lineHeight: 22 },
  text: { fontFamily: Fonts.sans, fontSize: 14, lineHeight: 21 },
  hint: { fontFamily: Fonts.sans, fontSize: 12, lineHeight: 18 },
  button: { minHeight: 44, borderWidth: 1, borderRadius: Radius.lg, paddingHorizontal: Spacing.three, paddingVertical: Spacing.two, justifyContent: 'center' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', padding: Spacing.four, justifyContent: 'center' },
  dialog: { width: '100%', maxWidth: 480, maxHeight: '85%', alignSelf: 'center', borderRadius: Radius['2xl'], overflow: 'hidden' },
  dialogContent: { padding: Spacing.four, gap: Spacing.three },
  progress: { flexDirection: 'row', gap: Spacing.two, alignItems: 'center' },
});
