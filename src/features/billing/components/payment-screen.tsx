import { Image } from 'expo-image';
import { Link, router, useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import { SymbolView } from 'expo-symbols';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { Fonts, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { ApiError } from '@/shared/api/api-error';
import { useSessionStore } from '@/shared/stores/session-store';

import { useBillingActions, usePayment } from '../hooks/use-billing';
import { paymentIdSchema } from '../types/billing.schema';
import { dateTime, money, planName } from '../utils/billing-format';
import { BillingBadge, BillingButton, BillingCard, BillingConfirm, BillingDetail, BillingIcon, BillingLayout, BillingLoading, BillingNotice, BillingStep, BillingText } from './billing-ui';

export function PaymentScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const token = useSessionStore((state) => state.accessToken);
  if (!token) return <BillingLayout title="Thanh toán"><BillingCard>
    <BillingIcon large name={{ ios: 'lock.shield', android: 'lock', web: 'lock' }} />
    <BillingText heading>Đăng nhập để xem giao dịch</BillingText><BillingText>Chỉ chủ tài khoản mới xem được thông tin và trạng thái thanh toán.</BillingText><BillingButton label="Đăng nhập" onPress={() => router.push({ pathname: '/login', params: { returnTo: '/billing' } })} />
  </BillingCard></BillingLayout>;
  if (!paymentIdSchema.safeParse(id).success) return <BillingLayout title="Thanh toán"><BillingNotice error title="Không tìm thấy giao dịch">Mã giao dịch không hợp lệ. Hãy mở lại từ lịch sử thanh toán.</BillingNotice><BillingButton label="Về gói của bạn" onPress={() => router.replace('/billing')} /></BillingLayout>;
  return <PaymentContent key={`${id}:${token}`} id={id} />;
}

function PaymentContent({ id }: { id: string }) {
  const theme = useTheme();
  const payment = usePayment(id);
  const { cancel } = useBillingActions();
  const [confirm, setConfirm] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [qrError, setQrError] = useState(false);
  const [checking, setChecking] = useState(false);
  const lock = useRef(false);
  const data = payment.data;
  const pending = data?.status === 'PENDING';
  async function check() {
    setNotice('');
    setChecking(true);
    try {
      const result = await payment.refetch();
      if (result.data?.status === 'PENDING' && !result.isError) setNotice('Nếu đã chuyển tiền, bạn chỉ cần chờ thêm, đừng chuyển lại.');
    } finally { setChecking(false); }
  }
  async function cancelPending() {
    if (lock.current) return;
    lock.current = true;
    setError('');
    try { await cancel.mutateAsync(id); setConfirm(false); }
    catch { setConfirm(false); setError('Chưa hủy được giao dịch. Hãy kiểm tra lại trạng thái trước khi thử lại.'); void payment.refetch(); }
    finally { lock.current = false; }
  }
  const footer = payment.isError ? <BillingButton label="Thử tải lại giao dịch" busy={checking} onPress={() => void check()} />
    : data && pending ? <>
      <BillingText variant="caption" style={styles.centerText}>Đã chuyển khoản rồi?</BillingText>
      <BillingButton label="Kiểm tra lại" busy={checking} disabled={payment.isFetching || cancel.isPending} icon={{ ios: 'arrow.clockwise', android: 'refresh', web: 'refresh' }} onPress={() => void check()} />
    </> : data ? <BillingButton label="Về gói của bạn" onPress={() => router.replace('/billing')} /> : undefined;
  return <BillingLayout title="Thanh toán" footer={footer} onRefresh={() => { if (!cancel.isPending) void check(); }} refreshing={payment.isFetching || cancel.isPending}>
    {payment.isPending ? <BillingLoading /> : null}
    {payment.isError ? <BillingCard>
      <BillingIcon large name={{ ios: 'wifi.exclamationmark', android: 'error_outline', web: 'error_outline' }} />
      <BillingText heading>Chưa tải được giao dịch</BillingText>
      <BillingText error>{payment.error instanceof ApiError && payment.error.status === 404 ? 'Không tìm thấy giao dịch thuộc tài khoản của bạn.' : 'Kiểm tra mạng rồi thử lại. Chỉ chuyển tiền khi đã tải được thông tin.'}</BillingText>
      <BillingButton quiet label="Về gói của bạn" onPress={() => router.replace('/billing')} />
    </BillingCard> : null}
    {data && !payment.isError ? <>
      <View style={[styles.summary, { backgroundColor: data.status === 'SUCCEEDED' || pending ? theme.secondary : theme.muted }]}>
        {data.status === 'SUCCEEDED' ? <BillingIcon large name={{ ios: 'checkmark.circle', android: 'check_circle', web: 'check_circle' }} />
          : data.status === 'CANCELLED' ? <BillingIcon large neutral name={{ ios: 'xmark.circle', android: 'cancel', web: 'cancel' }} />
            : <BillingBadge pending label="Chờ thanh toán" />}
        {data.status !== 'PENDING' ? <BillingText heading style={styles.centerText}>{data.status === 'SUCCEEDED' ? 'Thanh toán thành công' : 'Giao dịch đã hủy'}</BillingText> : null}
        <BillingText variant="price" style={styles.amount}>{money(data.amount)}</BillingText>
        <View style={[styles.planPill, { backgroundColor: theme.card }]}>
          <Text style={[styles.planPillText, { color: theme.foreground }]}>Gói {planName(data.planCode)} · {data.durationDays} ngày</Text>
        </View>
      </View>
      {data.status === 'SUCCEEDED' ? <>
        <BillingCard accent><BillingText heading>Đã ghi nhận gói {planName(data.planCode)}</BillingText>
          {data.capturedAt ? <BillingText>Đã kích hoạt từ {dateTime(data.capturedAt)} (UTC+7).</BillingText> : null}
          <BillingText>Xem thời hạn và lịch sử ở màn Gói của bạn.</BillingText>
        </BillingCard>
        <BillingNotice>Pro và Premium hiện mới ghi nhận gói bạn đã mua, chưa kèm quyền lợi thêm.</BillingNotice>
      </> : data.status === 'CANCELLED' ? <BillingNotice title="Đừng dùng lại mã QR này">Nếu bạn đã chuyển tiền trước khi hủy, hãy giữ mã giao dịch ngân hàng và liên hệ quản trị viên để đối soát. Vedora không tự hoàn tiền.</BillingNotice> : <>
        <BillingCard>
          <BillingStep number={1} title="Chuyển khoản" />
          {data.qr ? <>
            <BillingText variant="caption">Quét mã bằng ứng dụng ngân hàng, hoặc lưu ảnh QR về máy.</BillingText>
            <View style={styles.qrFrame}>
              <Image source={{ uri: data.qr.imageUrl }} style={styles.qr} contentFit="contain" accessibilityLabel={`QR chuyển khoản ${money(data.amount)} cho gói ${planName(data.planCode)}`} onError={() => setQrError(true)} onLoad={() => setQrError(false)} />
            </View>
            {qrError ? <BillingNotice error>Không tải được QR. Bạn có thể chuyển khoản bằng thông tin bên dưới.</BillingNotice> : null}
            <Link href={data.qr.downloadUrl} target="_blank" asChild><Pressable accessibilityRole="link" style={({ pressed }) => [styles.qrLink, { backgroundColor: theme.secondary, opacity: pressed ? 0.8 : 1 }]}>
              <SymbolView name={{ ios: 'arrow.down.to.line', android: 'download', web: 'download' }} size={17} tintColor={theme.primary} />
              <Text style={[styles.linkText, { color: theme.primary }]}>Mở ảnh QR để lưu</Text>
            </Pressable></Link>
            <View style={[styles.detailBox, { backgroundColor: theme.muted }]}>
              <BillingDetail label="Ngân hàng" value={data.qr.bankGateway} />
              <BillingDetail label="Số tài khoản" value={data.qr.accountNumber} emphasize />
              <BillingDetail label="Chủ tài khoản" value={data.qr.accountHolder} />
              <BillingDetail label="Số tiền chuyển" value={money(data.amount)} emphasize />
              <BillingDetail label="Nội dung chuyển khoản" value={data.qr.transferContent} emphasize last />
            </View>
            <BillingNotice title="Đúng số tiền, đúng nội dung">Giữ nguyên nội dung và số tiền để hệ thống nhận ra giao dịch. Nhấn giữ để chọn và sao chép.</BillingNotice>
          </> : <BillingNotice title="Tạm thời chưa nhận thanh toán">Đừng chuyển tiền theo mã QR đã lưu. Hãy quay lại sau.</BillingNotice>}
        </BillingCard>
        <BillingCard>
          <BillingStep number={2} title="Chờ xác nhận" />
          <View style={[styles.waiting, { backgroundColor: theme.muted }]}>
            <ActivityIndicator size="small" color={theme.primary} />
            <Text style={[styles.waitingText, { color: theme.foreground }]}>Đang chờ ngân hàng xác nhận…</Text>
          </View>
          <BillingText>Trạng thái tự cập nhật sau khi bạn chuyển khoản. Nếu chưa thấy đổi, bấm “Kiểm tra lại” bên dưới.</BillingText>
          {notice ? <BillingNotice title="Chưa có xác nhận">{notice}</BillingNotice> : null}
          <BillingText variant="caption">Gói có hiệu lực khi được xác nhận, thay gói cũ và không cộng dồn thời gian.</BillingText>
        </BillingCard>
      </>}
      <BillingCard style={styles.receipt}>
        <BillingText variant="eyebrow">THÔNG TIN GIAO DỊCH</BillingText>
        <View>
          <BillingDetail label="Mã thanh toán" value={data.paymentCode} />
          <BillingDetail label="Hóa đơn" value={data.invoiceNumber} last />
        </View>
        <BillingText variant="caption">Đã chuyển mà chưa được xác nhận thì đừng chuyển thêm. Hãy giữ mã thanh toán và mã giao dịch ngân hàng để đối soát.</BillingText>
      </BillingCard>
      {pending ? <BillingButton danger label="Tôi chưa chuyển tiền, hủy giao dịch" disabled={cancel.isPending || payment.isFetching} onPress={() => setConfirm(true)} /> : null}
    </> : null}
    {error ? <BillingNotice error title="Chưa thể hủy giao dịch">{error}</BillingNotice> : null}
    <BillingConfirm visible={confirm && pending && !payment.isError} title="Hủy giao dịch này?" onClose={() => { if (!cancel.isPending) setConfirm(false); }}>
      <BillingText>Chỉ hủy khi bạn chưa chuyển tiền. Nếu đã chuyển khoản, hãy giữ giao dịch để chờ xác nhận.</BillingText>
      <BillingNotice title="Hủy không hoàn tiền">Vedora không thu hồi hay tự hoàn khoản bạn đã chuyển.</BillingNotice>
      <BillingButton secondary label="Giữ giao dịch" disabled={cancel.isPending} onPress={() => setConfirm(false)} />
      <BillingButton danger label="Chưa chuyển tiền · Xác nhận hủy" busy={cancel.isPending} onPress={() => void cancelPending()} />
    </BillingConfirm>
  </BillingLayout>;
}

const styles = StyleSheet.create({
  summary: { alignItems: 'center', gap: Spacing.two + Spacing.one, borderRadius: Radius['3xl'], paddingVertical: Spacing.four, paddingHorizontal: Spacing.three },
  centerText: { textAlign: 'center' },
  amount: { fontSize: 34, lineHeight: 44, textAlign: 'center' },
  planPill: { borderRadius: 99, paddingHorizontal: Spacing.three, paddingVertical: Spacing.one + Spacing.half },
  planPillText: { fontFamily: Fonts.sansSemibold, fontSize: 13, lineHeight: 19 },
  qrFrame: { alignSelf: 'center', width: '100%', maxWidth: 300, backgroundColor: '#fff', borderRadius: Radius['2xl'], padding: Spacing.three, alignItems: 'center', shadowColor: '#14261a', shadowOpacity: 0.1, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  qr: { width: '100%', aspectRatio: 0.85 },
  qrLink: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.two, borderRadius: Radius.xl, paddingHorizontal: Spacing.three },
  linkText: { fontFamily: Fonts.sansBold, fontSize: 14, lineHeight: 21, textAlign: 'center' },
  detailBox: { borderRadius: Radius.xl, paddingHorizontal: Spacing.three },
  waiting: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two + Spacing.one, borderRadius: Radius.xl, paddingHorizontal: Spacing.three, paddingVertical: Spacing.two + Spacing.one },
  waitingText: { flex: 1, fontFamily: Fonts.sansMedium, fontSize: 14, lineHeight: 20 },
  receipt: { gap: Spacing.two + Spacing.one },
});
