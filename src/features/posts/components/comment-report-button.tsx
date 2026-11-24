import { SymbolView } from 'expo-symbols';
import { useRef, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ZodError } from 'zod';

import { Fonts } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { ApiError } from '@/shared/api/api-error';

import { useReportComment } from '../hooks/use-report-comment';
import { commentReportFormSchema, MAX_REPORT_DETAILS_LENGTH, REPORT_REASONS, REPORT_REASON_LABELS, type ReportReason } from '../types/posts.schema';

export function CommentReportButton({ postId, commentId, body }: { postId: string; commentId: string; body: string }) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const report = useReportComment(postId, commentId);
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [details, setDetails] = useState('');
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const lock = useRef(false);
  function close() {
    if (lock.current) return;
    setOpen(false); setReason(null); setDetails(''); setDone(false); setError('');
  }
  async function send() {
    if (lock.current || report.isPending) return;
    setError('');
    const input = commentReportFormSchema.safeParse({ reason, details });
    if (!input.success) { setError(input.error.issues[0]?.message ?? 'Chọn một lý do.'); return; }
    lock.current = true;
    try { await report.mutateAsync(input.data); setDone(true); }
    catch (caught) {
      if (caught instanceof ApiError && caught.code === 'ALREADY_REPORTED') setDone(true);
      else setError(caught instanceof ZodError ? 'Dữ liệu phản hồi chưa hợp lệ. Vui lòng thử lại.'
        : caught instanceof ApiError && caught.code === 'OWN_COMMENT' ? 'Bạn không thể báo cáo bình luận của chính mình.'
          : caught instanceof ApiError && caught.status === 404 ? 'Bình luận hoặc bài viết không còn khả dụng.'
            : caught instanceof ApiError && caught.status === 401 ? 'Phiên đăng nhập đã thay đổi. Đóng form và đăng nhập lại.'
              : caught instanceof ApiError && caught.status === 429 ? 'Bạn thao tác quá nhanh. Vui lòng thử lại sau.'
                : 'Chưa gửi được báo cáo. Kiểm tra kết nối và thử lại; nội dung vẫn được giữ.');
    } finally { lock.current = false; }
  }
  return <>
    <Pressable accessibilityRole="button" accessibilityLabel="Báo cáo bình luận" onPress={() => setOpen(true)} style={styles.trigger}>
      <Text style={[styles.action, { color: theme.mutedForeground }]}>Báo cáo</Text>
    </Pressable>
    <Modal visible={open} transparent animationType="fade" onRequestClose={close}>
      <Pressable style={styles.backdrop} onPress={close}>
        <Pressable onPress={() => undefined} style={[styles.sheet, { backgroundColor: theme.card, paddingBottom: Math.max(16, insets.bottom) }]}>
          <ScrollView keyboardShouldPersistTaps="handled" automaticallyAdjustKeyboardInsets contentContainerStyle={styles.content}>
            <View style={styles.header}>
              <Text accessibilityRole="header" style={[styles.title, { color: theme.foreground }]}>{done ? 'Đã tiếp nhận báo cáo' : 'Báo cáo bình luận'}</Text>
              <Pressable accessibilityRole="button" accessibilityLabel="Đóng báo cáo bình luận" disabled={report.isPending} onPress={close} style={styles.close}>
                <SymbolView name={{ ios: 'xmark', android: 'close', web: 'close' }} size={20} tintColor={theme.foreground} />
              </Pressable>
            </View>
            {done ? <>
              <Text style={[styles.text, { color: theme.foreground }]}>Cảm ơn bạn đã góp phần chăm sóc cộng đồng. Nếu bạn đã báo cáo trước đó, yêu cầu vẫn được ghi nhận. Vedora sẽ thông báo khi có kết quả xử lý.</Text>
              <Pressable accessibilityRole="button" onPress={close} style={[styles.send, { backgroundColor: theme.primary }]}><Text style={[styles.action, { color: theme.primaryForeground }]}>Đóng</Text></Pressable>
            </> : <>
              <View style={[styles.quote, { backgroundColor: theme.muted }]}><Text numberOfLines={3} style={[styles.text, { color: theme.mutedForeground }]}>{body}</Text></View>
              <Text style={[styles.text, { color: theme.foreground }]}>Vì sao bạn báo cáo bình luận này?</Text>
              {REPORT_REASONS.map((value) => <Pressable key={value} accessibilityRole="radio" accessibilityState={{ checked: reason === value, disabled: report.isPending }} disabled={report.isPending} onPress={() => setReason(value)} style={[styles.reason, { borderColor: reason === value ? theme.primary : theme.border, backgroundColor: reason === value ? theme.secondary : theme.background }]}>
                <SymbolView name={{ ios: reason === value ? 'largecircle.fill.circle' : 'circle', android: reason === value ? 'radio_button_checked' : 'radio_button_unchecked', web: reason === value ? 'radio_button_checked' : 'radio_button_unchecked' }} size={20} tintColor={theme.primary} />
                <Text style={[styles.text, { flex: 1, color: theme.foreground }]}>{REPORT_REASON_LABELS[value]}</Text>
              </Pressable>)}
              <TextInput accessibilityLabel="Chi tiết báo cáo bình luận" value={details} onChangeText={setDetails} multiline editable={!report.isPending} maxLength={MAX_REPORT_DETAILS_LENGTH} placeholder="Mô tả thêm (không bắt buộc)…" placeholderTextColor={theme.mutedForeground} style={[styles.input, { color: theme.foreground, borderColor: theme.border }]} />
              <Text style={[styles.counter, { color: theme.mutedForeground }]}>{details.length}/{MAX_REPORT_DETAILS_LENGTH} ký tự</Text>
              {error ? <Text accessibilityRole="alert" style={[styles.text, { color: theme.destructive }]}>{error}</Text> : null}
              <Pressable accessibilityRole="button" accessibilityLabel="Gửi báo cáo bình luận" accessibilityState={{ disabled: report.isPending, busy: report.isPending }} disabled={report.isPending} onPress={() => void send()} style={[styles.send, { backgroundColor: theme.primary, opacity: report.isPending ? 0.5 : 1 }]}><Text style={[styles.action, { color: theme.primaryForeground }]}>{report.isPending ? 'Đang gửi…' : 'Gửi báo cáo'}</Text></Pressable>
            </>}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  </>;
}
const styles = StyleSheet.create({
  trigger: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 4 }, action: { fontFamily: Fonts.sansBold, fontSize: 13 },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: { maxHeight: '85%', width: '100%', maxWidth: 680, alignSelf: 'center', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 16 },
  content: { gap: 12 }, header: { flexDirection: 'row', alignItems: 'center', gap: 8 }, title: { flex: 1, fontFamily: Fonts.headingBold, fontSize: 17, lineHeight: 25 },
  close: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  text: { fontFamily: Fonts.sans, fontSize: 15, lineHeight: 22 }, quote: { padding: 12, borderRadius: 14 },
  reason: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderRadius: 14, padding: 12, minHeight: 48 },
  input: { fontFamily: Fonts.sans, fontSize: 16, lineHeight: 23, borderWidth: 1, borderRadius: 14, padding: 14, minHeight: 100, textAlignVertical: 'top' },
  counter: { fontFamily: Fonts.sans, fontSize: 12, textAlign: 'right' }, send: { minHeight: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', padding: 12 },
});
