import { router } from 'expo-router';
import { Image } from 'expo-image';
import { SymbolView } from 'expo-symbols';
import { useRef, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Fonts, Radius, Spacing } from '@/constants/theme';
import type { FeedPost } from '@/features/feed/types/feed.schema';
import { SharePostPicker } from '@/features/messaging/components/share-post-picker';
import { useMyProfile } from '@/features/profile/hooks/use-profile';
import { useTheme } from '@/hooks/use-theme';
import { ApiError } from '@/shared/api/api-error';
import { ZoomImage } from '@/shared/components/image-viewer';
import { useSessionStore } from '@/shared/stores/session-store';

import { useReportPost } from '../hooks/use-posts';
import { useDeletePost } from '../hooks/use-delete-post';
import { useReportEvidence } from '../hooks/use-report-evidence';
import { reportError } from '../utils/report-error';
import {
  MAX_REPORT_DETAILS_LENGTH,
  MAX_REPORT_IMAGES,
  MAX_REPORT_IMAGE_MB,
  REPORT_REASONS,
  REPORT_REASON_LABELS,
  reportFormSchema,
  type ReportReason,
} from '../types/posts.schema';

type Step = 'menu' | 'report' | 'done' | 'delete' | 'share';

/** Readers can report; only the signed-in author can confirm deletion. */
export function PostMenu({ postId, authorId, returnTo, postType, title, canShare = true, deletionLocked = false, onDeleted, variant = 'menu' }: { postId: string; authorId: string; returnTo: string; postType: FeedPost['type']; title?: string; canShare?: boolean; deletionLocked?: boolean; onDeleted?: () => void; variant?: 'menu' | 'share' }) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const token = useSessionStore((state) => state.accessToken);
  const me = useMyProfile(token);
  const report = useReportPost(postId);
  const upload = useReportEvidence(postId);
  const deletion = useDeletePost(postId, postType);
  const deleteLock = useRef(false);
  const shareLock = useRef(false);
  const reportLock = useRef(false);
  const shareAttempts = useRef<Record<string, string>>({});
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>('menu');
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [details, setDetails] = useState('');
  const [evidence, setEvidence] = useState<{ token: string | null; postId: string; images: { id: string; uri: string }[] }>({ token, postId, images: [] });
  const [error, setError] = useState('');
  const isOwn = !!token && !!me.data && me.data.id === authorId;
  const itemName = postType === 'BLOG' ? 'Blog' : 'bài viết';
  const images = evidence.token === token && evidence.postId === postId ? evidence.images : [];
  const reportBusy = report.isPending || upload.isPending;

  function close() {
    if (deleteLock.current || shareLock.current || reportLock.current) return;
    setOpen(false);
    setStep('menu');
    setReason(null);
    setDetails('');
    setEvidence({ token, postId, images: [] });
    setError('');
  }

  async function confirmDelete() {
    if (!isOwn || deletionLocked || deleteLock.current) return;
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
    if (reportLock.current || reportBusy) return;
    const parsed = reportFormSchema.safeParse({ reason, details, evidenceIds: images.map((image) => image.id) });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Thông tin chưa hợp lệ.');
      return;
    }
    setError('');
    reportLock.current = true;
    try {
      await report.mutateAsync(parsed.data);
      setStep('done');
    } catch (caught) {
      // Already in the queue, which is what the reporter wanted.
      if (caught instanceof ApiError && caught.code === 'ALREADY_REPORTED' && useSessionStore.getState().accessToken === token) setStep('done');
      else setError(reportError(caught));
    } finally {
      reportLock.current = false;
    }
  }

  async function addEvidence() {
    if (reportLock.current || reportBusy || images.length >= MAX_REPORT_IMAGES) return;
    reportLock.current = true;
    setError('');
    try {
      const image = await upload.mutateAsync();
      if (image && useSessionStore.getState().accessToken === token) setEvidence((previous) => ({ token, postId, images: [...(previous.token === token && previous.postId === postId ? previous.images : []), image] }));
    } catch (caught) { setError(reportError(caught)); }
    finally { reportLock.current = false; }
  }

  function openShare() {
    if (!canShare) return;
    if (!token) { close(); router.push({ pathname: '/login', params: { returnTo } }); return; }
    setStep('share');
    setOpen(true);
  }

  return (
    <>
      <Pressable accessibilityRole="button" accessibilityLabel={variant === 'share' ? 'Gửi bài viết qua tin nhắn' : 'Thêm tùy chọn cho bài viết'} onPress={variant === 'share' ? openShare : () => setOpen(true)} style={styles.trigger}>
        <SymbolView name={variant === 'share' ? { ios: 'paperplane', android: 'share', web: 'share' } : { ios: 'ellipsis', android: 'more_horiz', web: 'more_horiz' }} size={20} tintColor={theme.mutedForeground} />
      </Pressable>
      <Modal visible={open} transparent animationType="fade" onRequestClose={close}>
        <Pressable style={styles.backdrop} onPress={close}>
          <Pressable style={[styles.sheet, { backgroundColor: theme.card, borderColor: theme.border, paddingBottom: Math.max(Spacing.three, insets.bottom) }]} onPress={() => undefined}>
            {step === 'menu' ? (
              <>
                {canShare ? <Pressable accessibilityRole="button" accessibilityLabel="Gửi bài viết qua tin nhắn" onPress={openShare} style={styles.option}>
                  <SymbolView name={{ ios: 'paperplane', android: 'send', web: 'send' }} size={20} tintColor={theme.foreground} />
                  <Text style={[styles.optionText, { color: theme.foreground }]}>Gửi qua tin nhắn</Text>
                </Pressable> : null}
                {variant === 'menu' && !isOwn ? (
                  <Pressable accessibilityRole="button" accessibilityLabel="Báo cáo bài viết" onPress={openReport} style={styles.option}>
                    <SymbolView name={{ ios: 'flag', android: 'flag', web: 'flag' }} size={20} tintColor={theme.destructive} />
                    <Text style={[styles.optionText, { color: theme.destructive }]}>Báo cáo bài viết</Text>
                  </Pressable>
                ) : null}
                {variant === 'menu' && isOwn && !deletionLocked ? (
                  <Pressable accessibilityRole="button" accessibilityLabel={`Xóa ${itemName}`} onPress={() => { setError(''); setStep('delete'); }} style={styles.option}>
                    <SymbolView name={{ ios: 'trash', android: 'delete', web: 'delete' }} size={20} tintColor={theme.destructive} />
                    <Text style={[styles.optionText, { color: theme.destructive }]}>Xóa {itemName}</Text>
                  </Pressable>
                ) : null}
              </>
            ) : null}
            {step === 'share' && token ? (
              me.data ? <SharePostPicker postId={postId} selfId={me.data.id} lockRef={shareLock} attemptsRef={shareAttempts} onSent={close} />
                : <Pressable accessibilityRole="button" onPress={() => void me.refetch()} style={styles.option}><Text style={[styles.optionText, { color: theme.foreground }]}>{me.isError ? 'Không tải được hồ sơ · Thử lại' : 'Đang tải hồ sơ…'}</Text></Pressable>
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
              <ScrollView keyboardShouldPersistTaps="handled" automaticallyAdjustKeyboardInsets contentContainerStyle={styles.reportContent}>
                <View style={styles.reportHeader}>
                  <Text accessibilityRole="header" style={[styles.reportTitle, { color: theme.foreground }]}>Báo cáo {itemName}</Text>
                  <Pressable accessibilityRole="button" accessibilityLabel="Đóng báo cáo" disabled={reportBusy} onPress={close} style={[styles.closeButton, { backgroundColor: theme.muted, opacity: reportBusy ? 0.5 : 1 }]}>
                    <SymbolView name={{ ios: 'xmark', android: 'close', web: 'close' }} size={18} tintColor={theme.foreground} />
                  </Pressable>
                </View>
                <View style={[styles.reportHero, { backgroundColor: theme.secondary }]}>
                  <Image source={require('@/assets/branding/avocado-sticker.png')} contentFit="contain" accessible={false} style={styles.reportSticker} />
                  <View style={styles.heroCopy}>
                    <Text style={[styles.reportLabel, { color: theme.secondaryForeground }]}>Cùng chăm sóc cộng đồng</Text>
                    <Text style={[styles.reportHint, { color: theme.secondaryForeground }]}>Chia sẻ điều bạn thấy chưa phù hợp để Vedora xem xét nhé.</Text>
                  </View>
                </View>
                <Text style={[styles.reportLabel, { color: theme.foreground }]}>Vì sao bạn báo cáo nội dung này?</Text>
                {REPORT_REASONS.map((value) => (
                  <Pressable key={value} accessibilityRole="radio" accessibilityState={{ checked: reason === value, disabled: reportBusy }} disabled={reportBusy} onPress={() => setReason(value)} style={[styles.reportReason, { borderColor: reason === value ? theme.primary : theme.border, backgroundColor: reason === value ? theme.secondary : theme.background }]}>
                    <SymbolView name={{ ios: reason === value ? 'largecircle.fill.circle' : 'circle', android: reason === value ? 'radio_button_checked' : 'radio_button_unchecked', web: reason === value ? 'radio_button_checked' : 'radio_button_unchecked' }} size={20} tintColor={reason === value ? theme.primary : theme.mutedForeground} />
                    <Text style={[styles.optionText, { color: theme.foreground }]}>{REPORT_REASON_LABELS[value]}</Text>
                  </Pressable>
                ))}
                <Text style={[styles.reportLabel, { color: theme.foreground }]}>Chi tiết bổ sung <Text style={{ color: theme.mutedForeground }}>{reason === 'OTHER' ? '(bắt buộc)' : '(không bắt buộc)'}</Text></Text>
                <TextInput
                  accessibilityLabel="Chi tiết báo cáo"
                  value={details}
                  onChangeText={setDetails}
                  maxLength={MAX_REPORT_DETAILS_LENGTH}
                  multiline
                  editable={!reportBusy}
                  placeholder="Bạn có thể mô tả rõ hơn vấn đề ở đây…"
                  placeholderTextColor={theme.mutedForeground}
                  style={[styles.input, styles.reportInput, { color: theme.foreground, borderColor: theme.border, backgroundColor: theme.background }]}
                />
                <Text style={[styles.reportCounter, { color: theme.mutedForeground }]}>{details.length}/{MAX_REPORT_DETAILS_LENGTH} ký tự</Text>
                <View style={[styles.evidenceSection, { borderColor: theme.border, backgroundColor: theme.background }]}>
                  <View style={styles.evidenceHeader}>
                    <Text style={[styles.reportLabel, { color: theme.foreground }]}>Ảnh minh chứng</Text>
                    <Text style={[styles.evidenceCount, { color: theme.primary, backgroundColor: theme.secondary }]}>{images.length}/{MAX_REPORT_IMAGES}</Text>
                  </View>
                  <Text style={[styles.evidenceHint, { color: theme.mutedForeground }]}>Không bắt buộc · JPG, PNG, WebP · Tối đa {MAX_REPORT_IMAGE_MB} MB/ảnh</Text>
                  <View style={styles.evidenceGrid}>{images.map((image, index) => <View key={image.id} style={styles.evidenceItem}>
                  <ZoomImage source={{ uri: image.uri }} contentFit="cover" accessibilityLabel={`Ảnh minh chứng ${index + 1}`} style={styles.evidenceImage} />
                  <Pressable accessibilityRole="button" accessibilityLabel={`Gỡ ảnh minh chứng ${index + 1}`} accessibilityState={{ disabled: reportBusy }} disabled={reportBusy} onPress={() => setEvidence({ token, postId, images: images.filter((item) => item.id !== image.id) })} style={[styles.evidenceRemove, { opacity: reportBusy ? 0.5 : 1 }]}>
                    <View style={[styles.evidenceRemoveIcon, { backgroundColor: theme.card }]}><SymbolView name={{ ios: 'trash', android: 'delete', web: 'delete' }} size={17} tintColor={theme.destructive} /></View>
                  </Pressable>
                </View>)}
                {images.length < MAX_REPORT_IMAGES ? <Pressable accessibilityRole="button" accessibilityLabel="Thêm ảnh minh chứng" accessibilityState={{ disabled: reportBusy, busy: upload.isPending }} disabled={reportBusy} onPress={() => void addEvidence()} style={[styles.evidenceAdd, images.length ? styles.evidenceItem : styles.evidenceEmpty, { borderColor: theme.border, backgroundColor: theme.card, opacity: reportBusy ? 0.5 : 1 }]}>
                  <SymbolView name={{ ios: 'photo.badge.plus', android: 'add_photo_alternate', web: 'add_photo_alternate' }} size={22} tintColor={theme.primary} />
                  <Text style={[styles.evidenceAddLabel, { color: theme.primary }]}>{upload.isPending ? 'Đang tải…' : images.length ? 'Thêm ảnh' : 'Chọn ảnh minh chứng'}</Text>
                </Pressable> : null}
                  </View>
                  {images.length ? <Text style={[styles.evidenceHint, { color: theme.mutedForeground }]}>Chạm ảnh để xem lớn · Chạm thùng rác để gỡ</Text> : null}
                </View>
                {error ? <Text accessibilityRole="alert" style={[styles.error, { color: theme.destructive }]}>{error}</Text> : null}
                <View style={styles.reportActions}>
                  <Pressable accessibilityRole="button" disabled={reportBusy} onPress={close} style={[styles.reportCancel, { backgroundColor: theme.muted, opacity: reportBusy ? 0.5 : 1 }]}><Text style={[styles.action, { color: theme.mutedForeground }]}>Hủy</Text></Pressable>
                  <Pressable accessibilityRole="button" accessibilityLabel="Gửi báo cáo" accessibilityState={{ disabled: reportBusy, busy: reportBusy }} disabled={reportBusy} onPress={() => void submitReport()} style={[styles.reportSend, { backgroundColor: theme.primary, opacity: reportBusy ? 0.5 : 1 }]}>
                    <Text style={[styles.action, { color: theme.primaryForeground }]}>{report.isPending ? 'Đang gửi…' : 'Gửi báo cáo'}</Text>
                  </Pressable>
                </View>
              </ScrollView>
            ) : null}
            {step === 'done' ? (
              <View style={styles.done}>
                <View style={[styles.reportHero, { backgroundColor: theme.secondary }]}>
                  <Image source={require('@/assets/branding/tomato-sticker.png')} contentFit="contain" accessible={false} style={styles.reportSticker} />
                  <View style={styles.heroCopy}>
                    <Text accessibilityRole="header" style={[styles.reportTitle, { color: theme.secondaryForeground }]}>Cảm ơn bạn đã báo cáo</Text>
                    <Text style={[styles.reportHint, { color: theme.secondaryForeground }]}>Đội ngũ Vedora sẽ xem xét nội dung này.</Text>
                  </View>
                </View>
                <Pressable accessibilityRole="button" onPress={close} style={[styles.reportSend, { backgroundColor: theme.primary }]}><Text style={[styles.action, { color: theme.primaryForeground }]}>Đóng</Text></Pressable>
              </View>
            ) : null}
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  evidenceSection: { borderWidth: 1, borderRadius: 18, padding: 14, gap: 12 },
  evidenceHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  evidenceCount: { fontFamily: Fonts.sansSemibold, fontSize: 12, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  evidenceHint: { fontFamily: Fonts.sans, fontSize: 12, lineHeight: 18 },
  evidenceGrid: { flexDirection: 'row', columnGap: '3.5%', alignItems: 'flex-start' }, evidenceItem: { width: '31%', aspectRatio: 1 },
  evidenceImage: { width: '100%', height: '100%', borderRadius: 12 },
  evidenceRemove: { position: 'absolute', top: 0, right: 0, width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  evidenceRemoveIcon: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  evidenceAdd: { borderWidth: 1, borderStyle: 'dashed', borderRadius: 12, padding: 6, alignItems: 'center', justifyContent: 'center', gap: 6 },
  evidenceEmpty: { width: '100%', minHeight: 96 },
  evidenceAddLabel: { fontFamily: Fonts.sansSemibold, fontSize: 12, lineHeight: 17, textAlign: 'center' },
  reportContent: { gap: 12, paddingBottom: 8 },
  reportHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  reportTitle: { fontFamily: Fonts.headingBold, fontSize: 17, lineHeight: 25, flexShrink: 1 },
  closeButton: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  reportHero: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderRadius: 22 },
  reportSticker: { width: 58, height: 70 }, heroCopy: { flex: 1, minWidth: 0, gap: 6 },
  reportLabel: { fontFamily: Fonts.sansSemibold, fontSize: 14, lineHeight: 21 },
  reportHint: { fontFamily: Fonts.sans, fontSize: 14, lineHeight: 21 },
  reportReason: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 50, padding: 12, borderRadius: 14, borderWidth: 1 },
  reportInput: { marginTop: 0, minHeight: 110, padding: 14, fontSize: 16, lineHeight: 23 },
  reportCounter: { fontFamily: Fonts.sans, fontSize: 12, textAlign: 'right' },
  reportActions: { flexDirection: 'row', gap: 10 },
  reportCancel: { minHeight: 48, padding: 12, minWidth: 80, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  reportSend: { flexGrow: 1, minHeight: 48, padding: 12, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  trigger: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
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
