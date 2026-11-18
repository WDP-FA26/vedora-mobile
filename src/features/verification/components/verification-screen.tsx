import { router, useFocusEffect } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ZodError } from 'zod';

import { BrandColors, Fonts, Radius, Spacing } from '@/constants/theme';
import { usePullToRefresh } from '@/hooks/use-pull-to-refresh';
import { useTheme } from '@/hooks/use-theme';
import { ApiError } from '@/shared/api/api-error';
import { ZoomImage } from '@/shared/components/image-viewer';
import { useSessionStore } from '@/shared/stores/session-store';

import { useMyVerification, useSubmitVerification, useUploadProof } from '../hooks/use-verification';
import { MAX_PROOFS, MAX_PROOF_MB, MAX_STATEMENT_LENGTH, submitVerificationSchema } from '../types/verification.schema';
import { canSubmitVerification, verificationLabel } from '../utils/verification-state';

const ERRORS: Record<string, string> = {
  ALREADY_VERIFIED: 'Tài khoản của bạn đã được xác minh.',
  REQUEST_PENDING: 'Bạn đã có yêu cầu đang chờ duyệt. Hãy kiểm tra trạng thái bên trên.',
  PROOF_NOT_UPLOADED: 'Ảnh chưa được kho lưu trữ xác nhận. Đợi một chút rồi bấm gửi lại.',
  PROOF_LIMIT_REACHED: 'Bạn đã tải lên quá nhiều ảnh chưa nộp. Hãy thử lại sau.',
  FILE_TOO_LARGE: 'Ảnh quá lớn. Chọn ảnh không quá 10 MB.',
};

function errorMessage(error: unknown) {
  if (error instanceof ZodError) return error.issues[0]?.message ?? 'Kiểm tra lại nội dung.';
  if (error instanceof ApiError) {
    if (error.code && ERRORS[error.code]) return ERRORS[error.code];
    if (error.status === 503) return 'Chưa thể nhận minh chứng lúc này. Hãy thử lại sau.';
    return 'Không gửi được dữ liệu. Kiểm tra kết nối rồi thử lại; nội dung và ảnh đã tải vẫn được giữ.';
  }
  return error instanceof Error ? error.message : 'Có lỗi xảy ra. Hãy thử lại.';
}

function dateTime(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleString('vi-VN');
}

function VerificationForm() {
  const theme = useTheme();
  const upload = useUploadProof();
  const submit = useSubmitVerification();
  const [statement, setStatement] = useState('');
  const [proofs, setProofs] = useState<{ id: string; uri: string }[]>([]);
  const [error, setError] = useState('');
  const lock = useRef(false);
  const busy = upload.isPending || submit.isPending;

  async function addProof() {
    if (lock.current || proofs.length >= MAX_PROOFS) return;
    lock.current = true;
    setError('');
    try {
      const proof = await upload.mutateAsync();
      if (proof) setProofs((current) => [...current, proof]);
    } catch (error) { setError(errorMessage(error)); }
    finally { lock.current = false; }
  }

  async function send() {
    if (lock.current) return;
    const parsed = submitVerificationSchema.safeParse({ statement, proofIds: proofs.map((proof) => proof.id) });
    if (!parsed.success) { setError(errorMessage(parsed.error)); return; }
    lock.current = true;
    setError('');
    try { await submit.mutateAsync(parsed.data); }
    catch (error) { setError(errorMessage(error)); }
    finally { lock.current = false; }
  }

  return (
    <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <Text style={[styles.heading, { color: theme.foreground }]}>Công việc chuyên môn của bạn</Text>
      <Text style={[styles.body, { color: theme.mutedForeground }]}>Giới thiệu chuyên môn, nơi làm việc, kinh nghiệm và ảnh đính kèm chứng minh điều gì. Viết từ 20 đến {MAX_STATEMENT_LENGTH} ký tự.</Text>
      <TextInput accessibilityLabel="Mô tả công việc chuyên môn" multiline maxLength={MAX_STATEMENT_LENGTH} editable={!busy}
        value={statement} onChangeText={(value) => { setStatement(value); setError(''); }}
        placeholder="Ví dụ: Tôi là đầu bếp tại…, có kinh nghiệm…; ảnh đính kèm là chứng chỉ…" placeholderTextColor={theme.mutedForeground}
        style={[styles.input, { color: theme.foreground, borderColor: theme.border, backgroundColor: theme.background }]} />
      <Text style={[styles.caption, { color: theme.mutedForeground }]}>{statement.length}/{MAX_STATEMENT_LENGTH} ký tự</Text>
      <Text style={[styles.heading, { color: theme.foreground }]}>Ảnh minh chứng ({proofs.length}/{MAX_PROOFS})</Text>
      <Text style={[styles.body, { color: theme.mutedForeground }]}>Chứng chỉ, thẻ nghề hoặc tài liệu có tên bạn. Cần 1–{MAX_PROOFS} ảnh JPEG, PNG hoặc WebP, mỗi ảnh không quá {MAX_PROOF_MB} MB. Nội dung và ảnh chỉ dùng để quản trị viên xét duyệt, không hiển thị công khai.</Text>
      <View style={styles.proofs}>
        {proofs.map((proof, index) => (
          <View key={proof.id} style={[styles.proof, { borderColor: theme.border }]}>
            <ZoomImage source={{ uri: proof.uri }} style={styles.preview} contentFit="cover" accessibilityLabel={`Xem ảnh minh chứng ${index + 1}`} />
            <Pressable accessibilityRole="button" accessibilityLabel={`Gỡ ảnh minh chứng ${index + 1}`} disabled={busy}
              onPress={() => { setProofs((current) => current.filter((item) => item.id !== proof.id)); setError(''); }} style={[styles.remove, { backgroundColor: theme.card }]}>
              <SymbolView name={{ ios: 'xmark', android: 'close', web: 'close' }} size={18} tintColor={theme.foreground} />
            </Pressable>
          </View>
        ))}
      </View>
      {proofs.length < MAX_PROOFS ? <Pressable accessibilityRole="button" disabled={busy} onPress={() => void addProof()} style={[styles.button, { borderColor: theme.border, borderWidth: 1, opacity: busy ? 0.6 : 1 }]}>
        {upload.isPending ? <ActivityIndicator color={theme.primary} /> : <SymbolView name={{ ios: 'photo.badge.plus', android: 'add_photo_alternate', web: 'add_photo_alternate' }} size={22} tintColor={theme.primary} />}
        <Text style={[styles.buttonText, { color: theme.primary }]}>{upload.isPending ? 'Đang chọn và tải ảnh…' : 'Thêm ảnh minh chứng'}</Text>
      </Pressable> : null}
      {error ? <Text accessibilityRole="alert" style={[styles.body, { color: theme.destructive }]}>{error}</Text> : null}
      <Pressable accessibilityRole="button" disabled={busy} onPress={() => void send()} style={[styles.button, { backgroundColor: theme.primary, opacity: busy ? 0.6 : 1 }]}>
        {submit.isPending ? <ActivityIndicator color={theme.primaryForeground} /> : null}
        <Text style={[styles.buttonText, { color: theme.primaryForeground }]}>{submit.isPending ? 'Đang gửi yêu cầu…' : 'Gửi yêu cầu xác minh'}</Text>
      </Pressable>
      <Text style={[styles.caption, { color: theme.mutedForeground }]}>Hãy ở lại màn hình đến khi gửi xong. Chỉ gửi được một yêu cầu chờ duyệt tại một thời điểm.</Text>
    </View>
  );
}

export function VerificationScreen() {
  const theme = useTheme();
  const token = useSessionStore((state) => state.accessToken);
  return (
    <SafeAreaView edges={['top', 'bottom']} style={[styles.screen, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { borderColor: theme.border }]}>
        <Pressable accessibilityRole="button" accessibilityLabel="Quay lại hồ sơ" onPress={() => router.canGoBack() ? router.back() : router.replace('/me')} style={styles.back}>
          <SymbolView name={{ ios: 'chevron.left', android: 'arrow_back', web: 'arrow_back' }} size={22} tintColor={theme.foreground} />
        </Pressable>
        <Text style={[styles.heading, styles.headerTitle, { color: theme.foreground }]}>Xác minh chuyên gia</Text>
      </View>
      {token ? <VerificationContent key={token} /> : <View style={styles.content}>
        <Text style={[styles.body, { color: theme.foreground }]}>Đăng nhập để nộp minh chứng và theo dõi kết quả xác minh.</Text>
        <Pressable accessibilityRole="button" onPress={() => router.push({ pathname: '/login', params: { returnTo: '/verification' } })} style={[styles.button, { backgroundColor: theme.primary }]}><Text style={[styles.buttonText, { color: theme.primaryForeground }]}>Đăng nhập</Text></Pressable>
      </View>}
    </SafeAreaView>
  );
}

function VerificationContent() {
  const theme = useTheme();
  const query = useMyVerification();
  const { refetch } = query;
  useFocusEffect(useCallback(() => { void refetch(); }, [refetch]));
  const pull = usePullToRefresh(() => query.refetch());
  const data = query.data;
  const request = data?.request;
  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" refreshControl={<RefreshControl refreshing={pull.refreshing} onRefresh={pull.onRefresh} tintColor={theme.primary} />}>
        {query.isPending ? <ActivityIndicator accessibilityLabel="Đang tải trạng thái xác minh" color={theme.primary} /> : null}
        {query.isError ? <View style={[styles.card, { borderColor: theme.border }]}>
          <Text accessibilityRole="alert" style={[styles.body, { color: theme.destructive }]}>Không tải được trạng thái xác minh. Hãy kiểm tra kết nối rồi thử lại.</Text>
          <Pressable accessibilityRole="button" onPress={() => void query.refetch()} style={[styles.button, { borderColor: theme.border, borderWidth: 1 }]}><Text style={[styles.buttonText, { color: theme.primary }]}>Thử lại</Text></Pressable>
        </View> : null}
        {data ? <>
          <View style={[styles.card, { borderColor: theme.border, backgroundColor: theme.card }]}>
            <SymbolView name={{ ios: 'checkmark.seal.fill', android: 'verified', web: 'verified' }} size={38} tintColor={data.isProfessional ? BrandColors.verified : theme.mutedForeground} />
            <Text style={[styles.heading, { color: theme.foreground }]}>{verificationLabel(data)}</Text>
            <Text style={[styles.body, { color: theme.mutedForeground }]}>{data.isProfessional ? 'Tích xanh xác minh được hiển thị cạnh tên bạn trên hồ sơ.' : request?.status === 'PENDING' ? 'Yêu cầu đã gửi thành công. Kết quả sẽ được cập nhật tại đây; bạn có thể kéo xuống để kiểm tra lại.' : 'Dành cho đầu bếp, chuyên gia dinh dưỡng và nhà sáng tạo công thức. Huy hiệu giúp mọi người nhận biết người làm nghề, không mở thêm tính năng.'}</Text>
            {request ? <>
              <Text style={[styles.caption, { color: theme.mutedForeground }]}>Đã gửi: {dateTime(request.createdAt)} · {request.proofCount} ảnh minh chứng</Text>
              <Text style={[styles.body, { color: theme.foreground }]}>{request.statement}</Text>
              {request.reviewedAt ? <Text style={[styles.caption, { color: theme.mutedForeground }]}>Xét duyệt: {dateTime(request.reviewedAt)}</Text> : null}
              {request.reviewNote ? <Text style={[styles.body, { color: request.status === 'REJECTED' ? theme.destructive : theme.foreground }]}>Ghi chú từ quản trị viên: {request.reviewNote}</Text> : null}
              {request.status === 'REJECTED' && !data.isProfessional ? <Text style={[styles.body, { color: theme.mutedForeground }]}>Bạn có thể bổ sung mô tả, chọn lại ảnh minh chứng và gửi yêu cầu mới bên dưới.</Text> : null}
            </> : null}
          </View>
          {canSubmitVerification(data) ? <VerificationForm key={request?.id ?? 'new'} /> : null}
        </> : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { minHeight: 56, flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.two, borderBottomWidth: 1 },
  headerTitle: { flex: 1 },
  back: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  content: { padding: Spacing.three, gap: Spacing.three, width: '100%', maxWidth: 680, alignSelf: 'center', paddingBottom: Spacing.five },
  card: { borderWidth: 1, borderRadius: Radius['2xl'], padding: Spacing.three, gap: Spacing.three },
  heading: { fontFamily: Fonts.headingBold, fontSize: 18, lineHeight: 26 },
  body: { fontFamily: Fonts.sans, fontSize: 14, lineHeight: 21 },
  caption: { fontFamily: Fonts.sans, fontSize: 12, lineHeight: 18 },
  input: { minHeight: 140, borderWidth: 1, borderRadius: Radius.xl, padding: Spacing.three, textAlignVertical: 'top', fontFamily: Fonts.sans, fontSize: 15, lineHeight: 22 },
  button: { minHeight: 48, padding: Spacing.two, borderRadius: Radius.xl, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.two },
  buttonText: { fontFamily: Fonts.sansBold, fontSize: 14 },
  proofs: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  proof: { width: '30%', aspectRatio: 1, borderRadius: Radius.lg, overflow: 'hidden', borderWidth: 1 },
  preview: { width: '100%', height: '100%' },
  remove: { position: 'absolute', top: 0, right: 0, minWidth: 44, minHeight: 44, borderBottomLeftRadius: Radius.lg, alignItems: 'center', justifyContent: 'center' },
});
