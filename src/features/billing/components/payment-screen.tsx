import { Image } from 'expo-image';
import { Link, router, useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Fonts, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { ApiError } from '@/shared/api/api-error';
import { useSessionStore } from '@/shared/stores/session-store';

import { useBillingActions, usePayment } from '../hooks/use-billing';
import { paymentIdSchema } from '../types/billing.schema';
import { dateTime, money, planName } from '../utils/billing-format';
import { BillingBadge, BillingButton, BillingCard, BillingConfirm, BillingDetail, BillingIcon, BillingLayout, BillingLoading, BillingNotice, BillingText } from './billing-ui';

export function PaymentScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const token = useSessionStore((state) => state.accessToken);
  if (!token) return <BillingLayout title="Thanh toán"><BillingCard>
    <BillingIcon large name={{ ios: 'lock.shield', android: 'lock', web: 'lock' }} />
    <BillingText heading>Giao dịch của riêng bạn</BillingText><BillingText>Đăng nhập để xem thông tin và trạng thái thanh toán.</BillingText><BillingButton label="Đăng nhập để tiếp tục" onPress={() => router.push({ pathname: '/login', params: { returnTo: '/billing' } })} />
  </BillingCard></BillingLayout>;
  if (!paymentIdSchema.safeParse(id).success) return <BillingLayout title="Thanh toán"><BillingNotice error title="Không tìm thấy giao dịch">Mã giao dịch không hợp lệ. Vui lòng mở lại từ lịch sử thanh toán.</BillingNotice><BillingButton label="Về gói của bạn" onPress={() => router.replace('/billing')} /></BillingLayout>;
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
      if (result.data?.status === 'PENDING' && !result.isError) setNotice('Chưa nhận được xác nhận. Nếu đã chuyển tiền, bạn chỉ cần chờ thêm; không chuyển lại.');
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
      <BillingText variant="caption" style={styles.centerText}>Đã chuyển khoản? Kiểm tra xác nhận tại đây.</BillingText>
      <BillingButton label="Kiểm tra thanh toán" busy={checking} disabled={payment.isFetching || cancel.isPending} icon={{ ios: 'arrow.clockwise', android: 'refresh', web: 'refresh' }} onPress={() => void check()} />
    </> : data ? <BillingButton label="Về gói của bạn" onPress={() => router.replace('/billing')} /> : undefined;
  return <BillingLayout title="Thanh toán" footer={footer} onRefresh={() => { if (!cancel.isPending) void check(); }} refreshing={payment.isFetching || cancel.isPending}>
    {payment.isPending ? <BillingLoading /> : null}
    {payment.isError ? <BillingCard>
      <BillingIcon large name={{ ios: 'wifi.exclamationmark', android: 'error_outline', web: 'error_outline' }} />
      <BillingText heading>Chưa tải được giao dịch</BillingText>
      <BillingText error>{payment.error instanceof ApiError && payment.error.status === 404 ? 'Không tìm thấy giao dịch thuộc tài khoản của bạn.' : 'Kiểm tra kết nối rồi thử lại. Hãy đợi thông tin được cập nhật trước khi chuyển tiền.'}</BillingText>
      <BillingButton quiet label="Về gói của bạn" onPress={() => router.replace('/billing')} />
    </BillingCard> : null}
    {data && !payment.isError ? <>
      <View style={styles.summary}>
        {data.status === 'SUCCEEDED' ? <BillingIcon large name={{ ios: 'checkmark.circle', android: 'check_circle', web: 'check_circle' }} />
          : data.status === 'CANCELLED' ? <BillingIcon large neutral name={{ ios: 'xmark.circle', android: 'cancel', web: 'cancel' }} />
            : <BillingBadge pending label="Chờ thanh toán" />}
        {data.status !== 'PENDING' ? <BillingText heading style={styles.centerText}>{data.status === 'SUCCEEDED' ? 'Thanh toán thành công' : 'Giao dịch đã hủy'}</BillingText> : null}
        <BillingText variant="price">{money(data.amount)}</BillingText>
        <BillingText>Gói {planName(data.planCode)} · {data.durationDays} ngày</BillingText>
      </View>
      {data.status === 'SUCCEEDED' ? <>
        <BillingCard accent><BillingText heading>Đã ghi nhận gói {planName(data.planCode)}</BillingText>
          {data.capturedAt ? <BillingText>Đã kích hoạt từ {dateTime(data.capturedAt)} (UTC+7).</BillingText> : null}
          <BillingText>Quay về Gói của bạn để xem thời hạn và lịch sử thanh toán.</BillingText>
        </BillingCard>
        <BillingNotice>Pro và Premium hiện chỉ ghi nhận gói đã mua, chưa có đặc quyền bổ sung.</BillingNotice>
      </> : data.status === 'CANCELLED' ? <BillingNotice title="Không sử dụng QR cũ">Nếu đã chuyển tiền trước khi hủy, giữ mã giao dịch ngân hàng và liên hệ quản trị viên để đối soát. Hệ thống không tự hoàn tiền.</BillingNotice> : <>
        <BillingCard>
          <BillingText heading>1. Chuyển khoản</BillingText>
          {data.qr ? <>
            <BillingText>Mở ứng dụng ngân hàng để quét mã, hoặc lưu ảnh QR về điện thoại.</BillingText>
            <View style={styles.qrFrame}>
              <Image source={{ uri: data.qr.imageUrl }} style={styles.qr} contentFit="contain" accessibilityLabel={`QR chuyển khoản ${money(data.amount)} cho gói ${planName(data.planCode)}`} onError={() => setQrError(true)} onLoad={() => setQrError(false)} />
            </View>
            {qrError ? <BillingNotice error>Không tải được QR. Bạn có thể chuyển khoản bằng thông tin bên dưới.</BillingNotice> : null}
            <Link href={data.qr.downloadUrl} target="_blank" asChild><Pressable accessibilityRole="link" style={StyleSheet.flatten([styles.qrLink, { backgroundColor: theme.secondary }])}>
              <Text style={[styles.linkText, { color: theme.primary }]}>Mở ảnh QR để lưu</Text>
            </Pressable></Link>
            <View>
              <BillingDetail label="Ngân hàng" value={data.qr.bankGateway} />
              <BillingDetail label="Số tài khoản" value={data.qr.accountNumber} emphasize />
              <BillingDetail label="Chủ tài khoản" value={data.qr.accountHolder} />
              <BillingDetail label="Số tiền chuyển" value={money(data.amount)} emphasize />
              <BillingDetail label="Nội dung chuyển khoản" value={data.qr.transferContent} emphasize />
            </View>
            <BillingNotice title="Chuyển đúng thông tin">Giữ nguyên nội dung và chuyển đúng số tiền để giao dịch được nhận diện. Nhấn giữ thông tin để chọn và sao chép.</BillingNotice>
          </> : <BillingNotice title="Thanh toán đang tạm đóng">Không chuyển tiền theo QR đã lưu. Vui lòng kiểm tra lại sau.</BillingNotice>}
        </BillingCard>
        <BillingCard>
          <BillingText heading>2. Chờ xác nhận</BillingText>
          <BillingText>Sau khi chuyển khoản, trạng thái sẽ tự cập nhật tại đây. Bạn cũng có thể bấm “Kiểm tra thanh toán” bên dưới.</BillingText>
          {notice ? <BillingNotice title="Vẫn đang chờ xác nhận">{notice}</BillingNotice> : null}
          <BillingText variant="caption">Gói mới có hiệu lực khi được xác nhận, thay thế thời hạn cũ và không cộng dồn thời gian.</BillingText>
        </BillingCard>
      </>}
      <View style={styles.receipt}>
        <BillingText variant="eyebrow">THÔNG TIN GIAO DỊCH</BillingText>
        <BillingDetail label="Mã thanh toán" value={data.paymentCode} />
        <BillingDetail label="Hóa đơn" value={data.invoiceNumber} />
        <BillingText variant="caption">Nếu đã chuyển nhưng chưa được xác nhận, không chuyển thêm. Giữ mã thanh toán và mã giao dịch ngân hàng để đối soát.</BillingText>
      </View>
      {pending ? <BillingButton danger label="Tôi chưa chuyển tiền, hủy giao dịch" disabled={cancel.isPending || payment.isFetching} onPress={() => setConfirm(true)} /> : null}
    </> : null}
    {error ? <BillingNotice error title="Chưa thể hủy giao dịch">{error}</BillingNotice> : null}
    <BillingConfirm visible={confirm && pending && !payment.isError} title="Bạn chắc chắn muốn hủy?" onClose={() => { if (!cancel.isPending) setConfirm(false); }}>
      <BillingText>Chỉ hủy khi bạn chưa chuyển tiền. Nếu đã chuyển khoản, hãy giữ giao dịch để chờ xác nhận.</BillingText>
      <BillingNotice title="Hủy không đồng nghĩa hoàn tiền">Vedora không thu hồi hoặc tự hoàn lại khoản tiền bạn đã chuyển.</BillingNotice>
      <BillingButton secondary label="Giữ giao dịch" disabled={cancel.isPending} onPress={() => setConfirm(false)} />
      <BillingButton danger label="Chưa chuyển tiền · Xác nhận hủy" busy={cancel.isPending} onPress={() => void cancelPending()} />
    </BillingConfirm>
  </BillingLayout>;
}

const styles = StyleSheet.create({
  summary: { alignItems: 'center', gap: Spacing.two, paddingVertical: Spacing.three },
  centerText: { textAlign: 'center' },
  qrFrame: { backgroundColor: '#fff', borderRadius: Radius.xl, padding: Spacing.two, alignItems: 'center' },
  qr: { width: '100%', maxWidth: 280, aspectRatio: 0.85 },
  qrLink: { minHeight: 48, alignItems: 'center', justifyContent: 'center', borderRadius: Radius.xl, padding: Spacing.two },
  linkText: { fontFamily: Fonts.sansBold, fontSize: 14, lineHeight: 21, textAlign: 'center' },
  receipt: { paddingHorizontal: Spacing.two, gap: Spacing.two },
});
