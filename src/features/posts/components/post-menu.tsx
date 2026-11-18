import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useRef, useState } from 'react';
import { Modal, Pressable, ScrollView, Share, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Fonts, Radius, Spacing } from '@/constants/theme';
import type { FeedPost } from '@/features/feed/types/feed.schema';
import { useMyProfile } from '@/features/profile/hooks/use-profile';
import { useTheme } from '@/hooks/use-theme';
import { ApiError } from '@/shared/api/api-error';
import { WEB_URL } from '@/shared/config/env';
import { useSessionStore } from '@/shared/stores/session-store';

import { useReportPost } from '../hooks/use-posts';
import { useDeletePost } from '../hooks/use-delete-post';
import {
  MAX_REPORT_DETAILS_LENGTH,
  REPORT_REASONS,
  REPORT_REASON_LABELS,
  reportFormSchema,
  type ReportReason,
} from '../types/posts.schema';

type Step = 'menu' | 'report' | 'done' | 'delete';

/** Readers can report; only the signed-in author can confirm deletion. */
export function PostMenu({ postId, authorId, returnTo, postType, title, canShare = true, onDeleted }: { postId: string; authorId: string; returnTo: string; postType: FeedPost['type']; title?: string; canShare?: boolean; onDeleted?: () => void }) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const token = useSessionStore((state) => state.accessToken);
  const me = useMyProfile(token);
  const report = useReportPost(postId);
  const deletion = useDeletePost(postId, postType);
  const deleteLock = useRef(false);
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>('menu');
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [details, setDetails] = useState('');
  const [error, setError] = useState('');
  const isOwn = !!token && !!me.data && me.data.id === authorId;
  const itemName = postType === 'BLOG' ? 'Blog' : 'bài viết';

  function close() {
    if (deleteLock.current) return;
    setOpen(false);
    setStep('menu');
    setReason(null);
    setDetails('');
    setError('');
  }

  async function confirmDelete() {
    if (!isOwn || deleteLock.current) return;
    deleteLock.current = true;
    setError('');
    try {
      await deletion.mutateAsync();
      deleteLock.current = false;
      close();
      onDeleted?.();
    } catch (caught) {
      setError(caught instanceof ApiError && caught.status === 403
        ? 'Bạn không có quyền xóa nội dung này.'
        : caught instanceof ApiError && caught.status === 404
          ? 'Nội dung không còn tồn tại hoặc bạn không có quyền xóa. Hãy đóng và làm mới danh sách.'
          : caught instanceof ApiError && caught.status === 401
            ? 'Phiên đăng nhập đã hết hạn. Hãy đăng nhập lại.'
            : 'Chưa xóa được nội dung. Hãy kiểm tra kết nối và thử lại.');
    } finally {
      deleteLock.current = false;
    }
  }

  function openReport() {
    if (!token) {
      close();
      router.push({ pathname: '/login', params: { returnTo } });
      return;
    }
    setStep('report');
  }

  async function submitReport() {
    const parsed = reportFormSchema.safeParse({ reason, details });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Thông tin chưa hợp lệ.');
      return;
    }
    setError('');
    try {
      await report.mutateAsync(parsed.data);
      setStep('done');
    } catch (caught) {
      // Already in the queue, which is what the reporter wanted.
      if (caught instanceof ApiError && caught.code === 'ALREADY_REPORTED') setStep('done');
      else setError('Chưa gửi được báo cáo. Vui lòng thử lại.');
    }
  }

  async function share() {
    close();
    const url = `${WEB_URL}/posts/${postId}`;
    try {
      await Share.share({ message: url, url });
    } catch {
      // The user dismissed or the platform cannot share; nothing to recover.
    }
  }

  return (
    <>
      <Pressable accessibilityRole="button" accessibilityLabel="Thêm tùy chọn cho bài viết" onPress={() => setOpen(true)} hitSlop={8} style={styles.trigger}>
        <SymbolView name={{ ios: 'ellipsis', android: 'more_horiz', web: 'more_horiz' }} size={20} tintColor={theme.mutedForeground} />
      </Pressable>
      <Modal visible={open} transparent animationType="fade" onRequestClose={close}>
        <Pressable style={styles.backdrop} onPress={close}>
          <Pressable style={[styles.sheet, { backgroundColor: theme.card, borderColor: theme.border, paddingBottom: Math.max(Spacing.three, insets.bottom) }]} onPress={() => undefined}>
            {step === 'menu' ? (
              <>
                {canShare ? <Pressable accessibilityRole="button" onPress={() => void share()} style={styles.option}>
                  <SymbolView name={{ ios: 'square.and.arrow.up', android: 'share', web: 'share' }} size={20} tintColor={theme.foreground} />
                  <Text style={[styles.optionText, { color: theme.foreground }]}>Chia sẻ bài viết</Text>
                </Pressable> : null}
                {!isOwn ? (
                  <Pressable accessibilityRole="button" onPress={openReport} style={styles.option}>
                    <SymbolView name={{ ios: 'flag', android: 'flag', web: 'flag' }} size={20} tintColor={theme.destructive} />
                    <Text style={[styles.optionText, { color: theme.destructive }]}>Báo cáo bài viết</Text>
                  </Pressable>
                ) : null}
                {isOwn ? (
                  <Pressable accessibilityRole="button" accessibilityLabel={`Xóa ${itemName}`} onPress={() => { setError(''); setStep('delete'); }} style={styles.option}>
                    <SymbolView name={{ ios: 'trash', android: 'delete', web: 'delete' }} size={20} tintColor={theme.destructive} />
                    <Text style={[styles.optionText, { color: theme.destructive }]}>Xóa {itemName}</Text>
                  </Pressable>
                ) : null}
              </>
            ) : null}
            {step === 'delete' && isOwn ? (
              <ScrollView contentContainerStyle={styles.done}>
                <Text accessibilityRole="header" style={[styles.title, { color: theme.foreground }]}>Xóa {itemName} này?</Text>
                {title ? <Text numberOfLines={3} style={[styles.optionText, { color: theme.foreground }]}>{title}</Text> : null}
                <Text style={[styles.optionText, { color: theme.mutedForeground }]}>Nội dung và các tương tác liên quan sẽ bị xóa. Bạn không thể hoàn tác thao tác này.</Text>
                {error ? <Text accessibilityRole="alert" style={[styles.error, { color: theme.destructive }]}>{error}</Text> : null}
                <View style={styles.actions}>
                  <Pressable accessibilityRole="button" disabled={deletion.isPending} onPress={close} style={styles.confirmButton}>
                    <Text style={[styles.action, { color: theme.mutedForeground }]}>Hủy</Text>
                  </Pressable>
                  <Pressable accessibilityRole="button" accessibilityLabel={`Xác nhận xóa ${itemName}`} accessibilityState={{ disabled: deletion.isPending, busy: deletion.isPending }} disabled={deletion.isPending} onPress={() => void confirmDelete()} style={styles.confirmButton}>
                    <Text style={[styles.action, { color: theme.destructive, opacity: deletion.isPending ? 0.5 : 1 }]}>{deletion.isPending ? 'Đang xóa…' : 'Xóa vĩnh viễn'}</Text>
                  </Pressable>
                </View>
              </ScrollView>
            ) : null}
            {step === 'report' ? (
              <ScrollView keyboardShouldPersistTaps="handled">
                <Text style={[styles.title, { color: theme.foreground }]}>Báo cáo bài viết</Text>
                {REPORT_REASONS.map((value) => (
                  <Pressable key={value} accessibilityRole="radio" accessibilityState={{ selected: reason === value }} onPress={() => setReason(value)} style={styles.option}>
                    <SymbolView name={{ ios: reason === value ? 'largecircle.fill.circle' : 'circle', android: reason === value ? 'radio_button_checked' : 'radio_button_unchecked', web: reason === value ? 'radio_button_checked' : 'radio_button_unchecked' }} size={20} tintColor={reason === value ? theme.primary : theme.mutedForeground} />
                    <Text style={[styles.optionText, { color: theme.foreground }]}>{REPORT_REASON_LABELS[value]}</Text>
                  </Pressable>
                ))}
                <TextInput
                  accessibilityLabel="Chi tiết báo cáo"
                  value={details}
                  onChangeText={setDetails}
                  maxLength={MAX_REPORT_DETAILS_LENGTH}
                  multiline
                  placeholder="Mô tả thêm (không bắt buộc, trừ khi chọn Lý do khác)"
                  placeholderTextColor={theme.mutedForeground}
                  style={[styles.input, { color: theme.foreground, borderColor: theme.border }]}
                />
                {error ? <Text accessibilityRole="alert" style={[styles.error, { color: theme.destructive }]}>{error}</Text> : null}
                <View style={styles.actions}>
                  <Pressable accessibilityRole="button" onPress={close}><Text style={[styles.action, { color: theme.mutedForeground }]}>Hủy</Text></Pressable>
                  <Pressable accessibilityRole="button" disabled={report.isPending} onPress={() => void submitReport()}>
                    <Text style={[styles.action, { color: theme.destructive, opacity: report.isPending ? 0.5 : 1 }]}>{report.isPending ? 'Đang gửi…' : 'Gửi báo cáo'}</Text>
                  </Pressable>
                </View>
              </ScrollView>
            ) : null}
            {step === 'done' ? (
              <View style={styles.done}>
                <Text style={[styles.title, { color: theme.foreground }]}>Cảm ơn bạn đã báo cáo</Text>
                <Text style={[styles.optionText, { color: theme.mutedForeground }]}>Đội ngũ Vedora sẽ xem xét bài viết này.</Text>
                <Pressable accessibilityRole="button" onPress={close}><Text style={[styles.action, { color: theme.primary }]}>Đóng</Text></Pressable>
              </View>
            ) : null}
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: { minWidth: 36, minHeight: 36, alignItems: 'center', justifyContent: 'center' },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: { maxHeight: '80%', borderTopLeftRadius: Radius['2xl'], borderTopRightRadius: Radius['2xl'], borderWidth: 1, padding: Spacing.three, gap: Spacing.one },
  title: { fontFamily: Fonts.headingBold, fontSize: 17, marginBottom: Spacing.two },
  option: { minHeight: 46, flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  optionText: { fontFamily: Fonts.sans, fontSize: 15, flexShrink: 1 },
  input: { minHeight: 72, borderWidth: 1, borderRadius: Radius.xl, padding: Spacing.two, fontFamily: Fonts.sans, fontSize: 14, textAlignVertical: 'top', marginTop: Spacing.two },
  error: { fontFamily: Fonts.sans, fontSize: 13, marginTop: Spacing.two },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: Spacing.four, marginTop: Spacing.three },
  action: { fontFamily: Fonts.sansBold, fontSize: 15 },
  confirmButton: { minHeight: 44, minWidth: 64, alignItems: 'center', justifyContent: 'center' },
  done: { gap: Spacing.two, paddingBottom: Spacing.two },
});
