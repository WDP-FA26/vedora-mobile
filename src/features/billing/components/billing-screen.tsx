import { Image } from 'expo-image';
import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { BrandColors, Fonts, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { ApiError } from '@/shared/api/api-error';
import { useSessionStore } from '@/shared/stores/session-store';

import { useBilling, useBillingActions } from '../hooks/use-billing';
import type { Payment, Plan } from '../types/billing.schema';
import { dateTime, money, paymentStatus, planName } from '../utils/billing-format';
import { BillingBadge, BillingButton, BillingCard, BillingConfirm, BillingIcon, BillingLayout, BillingLoading, BillingNotice, BillingText } from './billing-ui';

const purchaseTerms = 'Gói mới bắt đầu ngay khi hệ thống xác nhận thanh toán và thay thế thời hạn gói cũ. Thời gian còn lại không được cộng dồn hoặc quy đổi tiền. Mỗi ngày có thời lượng 24 giờ.';

export function BillingScreen() {
  const token = useSessionStore((state) => state.accessToken);
  if (!token) return <BillingLayout title="Gói của bạn"><BillingCard>
    <Image source={require('@/assets/branding/carrot-sticker.png')} contentFit="contain" style={styles.welcomeSticker} accessible={false} />
    <BillingText heading>Quản lý gói ở một nơi</BillingText>
    <BillingText>Đăng nhập để xem gói đang dùng, thanh toán và theo dõi giao dịch của bạn.</BillingText>
    <BillingButton label="Đăng nhập để tiếp tục" onPress={() => router.push({ pathname: '/login', params: { returnTo: '/billing' } })} />
  </BillingCard></BillingLayout>;
  return <BillingContent key={token} token={token} />;
}

function BillingContent({ token }: { token: string }) {
  const theme = useTheme();
  const { catalog, overview } = useBilling();
  const { create } = useBillingActions();
  const [selected, setSelected] = useState<Plan | null>(null);
  const [error, setError] = useState('');
  const [showAll, setShowAll] = useState(false);
  const lock = useRef(false);
  const data = overview.data;
  const pending = data?.pendingPayment;
  const loading = catalog.isPending || overview.isPending;
  const unavailable = catalog.isError || overview.isError;
  const busy = create.isPending;
  async function purchase() {
    if (!selected || lock.current) return;
    lock.current = true;
    setError('');
    try {
      const payment = await create.mutateAsync(selected.code);
      if (useSessionStore.getState().accessToken !== token) return;
      setSelected(null);
      router.push({ pathname: '/payment/[id]', params: { id: payment.id } });
    } catch (caught) {
      setSelected(null);
      setError(caught instanceof ApiError && caught.code === 'PENDING_PAYMENT_CONFLICT' ? 'Bạn có giao dịch đang chờ. Tiếp tục hoặc hủy giao dịch đó trước khi mua gói khác.'
        : caught instanceof ApiError && caught.code === 'ACCOUNT_NOT_PAYABLE' ? 'Tài khoản cần hoạt động và đã xác minh email để mua gói.'
        : caught instanceof ApiError && caught.code === 'PAYMENTS_DISABLED' ? 'Thanh toán đang tạm đóng. Vui lòng thử lại sau.'
        : caught instanceof ApiError && caught.status === 401 ? 'Phiên đăng nhập đã hết hạn. Hãy đăng nhập lại.'
        : 'Chưa tạo được giao dịch. Kiểm tra đơn đang chờ hoặc thử lại cùng gói; không chuyển tiền khi chưa có thông tin thanh toán.');
    } finally { lock.current = false; }
  }
  function refresh() { if (!busy) { void catalog.refetch(); void overview.refetch(); } }
  return <BillingLayout title="Gói của bạn" refreshing={catalog.isFetching || overview.isFetching || busy} onRefresh={refresh}>
    {loading ? <BillingLoading /> : null}
    {unavailable ? <BillingNotice error title="Chưa cập nhật được thông tin">Kéo xuống để tải lại hoặc bấm biểu tượng làm mới ở góc trên. Bạn có thể mua gói sau khi tải thành công.</BillingNotice> : null}
    {error ? <BillingNotice error title="Chưa thể tạo thanh toán">{error}</BillingNotice> : null}
    {data ? <>
      <BillingCard accent>
        <View style={styles.row}>
          <View style={styles.flex}><BillingText variant="eyebrow">GÓI HIỆN TẠI</BillingText><BillingText variant="price">{planName(data.membership.planCode)}</BillingText></View>
          <View style={styles.heroStickerFrame}><Image source={require('@/assets/branding/carrot-sticker.png')} contentFit="contain" style={styles.heroSticker} accessible={false} /></View>
        </View>
        {data.membership.planCode === 'FREE' ? <BillingText>Bạn đang sử dụng Vedora miễn phí.</BillingText> : <>
          <BillingBadge label="Đang có hiệu lực" />
          {data.membership.expiresAt ? <BillingText>Đến {dateTime(data.membership.expiresAt)} (UTC+7)</BillingText> : null}
          {data.membership.startsAt ? <BillingText variant="caption">Bắt đầu từ {dateTime(data.membership.startsAt)}</BillingText> : null}
        </>}
        <View style={[styles.heroFoot, { borderColor: theme.border }]}>
          <SymbolView name={{ ios: 'checkmark.shield', android: 'verified_user', web: 'verified_user' }} size={16} tintColor={theme.primary} />
          <BillingText variant="caption">Không tự gia hạn · Không tự trừ tiền</BillingText>
        </View>
      </BillingCard>
      {pending ? <BillingCard>
        <BillingBadge pending label="Bạn có một giao dịch đang chờ" />
        <BillingText heading>{planName(pending.planCode)} · {money(pending.amount)}</BillingText>
        <BillingText>Tiếp tục hoặc hủy giao dịch này trước khi mua gói khác.</BillingText>
        <BillingButton label="Tiếp tục thanh toán" icon={{ ios: 'arrow.right', android: 'arrow_forward', web: 'arrow_forward' }} onPress={() => router.push({ pathname: '/payment/[id]', params: { id: pending.id } })} />
      </BillingCard> : null}
    </> : null}
    {catalog.data ? <View style={styles.section}>
      <View style={styles.sectionCopy}><BillingText heading>Chọn gói phù hợp</BillingText><BillingText>Thanh toán một lần qua chuyển khoản.</BillingText></View>
      <BillingNotice title="Thông tin trước khi mua">Pro và Premium hiện chỉ ghi nhận gói đã mua, chưa có đặc quyền bổ sung.</BillingNotice>
      {!catalog.data.paymentsEnabled ? <BillingNotice title="Thanh toán đang tạm đóng">Bạn vẫn có thể xem gói và lịch sử. Vui lòng quay lại sau để mua gói.</BillingNotice> : null}
      <View style={styles.plans}>
        {catalog.data.plans.map((plan) => <BillingCard key={plan.code} style={styles.plan}>
          <View style={styles.row}>
            <View style={[styles.planStickerFrame, { backgroundColor: plan.code === 'PRO' ? theme.secondary : theme.muted }]}>
              <Image source={plan.code === 'PRO' ? require('@/assets/branding/avocado-sticker.png') : require('@/assets/branding/tomato-sticker.png')} contentFit="contain" style={styles.planSticker} accessible={false} />
            </View>
            <BillingText heading style={styles.flex}>{plan.name}</BillingText>
            <BillingBadge neutral label={`${plan.durationDays} ngày`} />
          </View>
          <View><BillingText variant="price">{money(plan.priceVnd)}</BillingText><BillingText variant="caption">Thanh toán một lần · {plan.durationDays} ngày</BillingText></View>
          <BillingButton label={`Chọn ${plan.name}`} secondary disabled={busy || loading || unavailable || !!pending || !catalog.data.paymentsEnabled} onPress={() => { setError(''); setSelected(plan); }} />
        </BillingCard>)}
      </View>
      <BillingText variant="caption">Mua gói mới sẽ thay thế thời hạn gói cũ, không cộng dồn thời gian. Hết hạn, tài khoản trở về gói Miễn phí.</BillingText>
    </View> : null}
    {data ? <View style={styles.section}>
      <View style={styles.sectionCopy}><BillingText heading>Lịch sử thanh toán</BillingText><BillingText variant="caption">Tối đa 20 giao dịch gần nhất</BillingText></View>
      <BillingCard style={styles.history}>
        {!data.recentPayments.length ? <View style={styles.empty}>
          <BillingIcon name={{ ios: 'doc.text', android: 'receipt_long', web: 'receipt_long' }} />
          <BillingText heading>Chưa có giao dịch</BillingText><BillingText style={styles.centerText}>Giao dịch của bạn sẽ được lưu tại đây sau khi tạo thanh toán.</BillingText>
        </View> : data.recentPayments.slice(0, showAll ? 20 : 5).map((payment) => <PaymentRow key={payment.id} payment={payment} disabled={busy} />)}
        {data.recentPayments.length > 5 ? <BillingButton quiet label={showAll ? 'Thu gọn lịch sử' : `Xem tất cả (${data.recentPayments.length})`} onPress={() => setShowAll(!showAll)} /> : null}
      </BillingCard>
    </View> : null}
    <BillingConfirm visible={!!selected} title="Xác nhận gói của bạn" onClose={() => { if (!busy) setSelected(null); }}>
      {selected ? <BillingCard accent>
        <View style={styles.row}><BillingText heading style={styles.flex}>{selected.name}</BillingText><Image source={selected.code === 'PRO' ? require('@/assets/branding/avocado-sticker.png') : require('@/assets/branding/tomato-sticker.png')} contentFit="contain" style={styles.planSticker} accessible={false} /></View>
        <BillingText variant="price">{money(selected.priceVnd)}</BillingText><BillingText>{selected.durationDays} ngày · Thanh toán một lần</BillingText>
      </BillingCard> : null}
      <BillingNotice title="Lưu ý về thời hạn">{purchaseTerms}</BillingNotice>
      <BillingText>Gói hiện chưa có đặc quyền bổ sung. Bước tiếp theo sẽ hiển thị QR và thông tin chuyển khoản.</BillingText>
      <BillingButton label="Tiếp tục đến thanh toán" busy={busy} onPress={() => void purchase()} />
      <BillingButton quiet label="Chọn lại gói" disabled={busy} onPress={() => setSelected(null)} />
    </BillingConfirm>
  </BillingLayout>;
}

function PaymentRow({ payment, disabled }: { payment: Payment; disabled: boolean }) {
  const theme = useTheme();
  return <Pressable accessibilityRole="button" accessibilityLabel={`${planName(payment.planCode)}, ${money(payment.amount)}, ${paymentStatus[payment.status]}, ${dateTime(payment.createdAt)}. Xem chi tiết`} disabled={disabled} onPress={() => router.push({ pathname: '/payment/[id]', params: { id: payment.id } })} style={({ pressed }) => [styles.historyRow, { borderColor: theme.border, opacity: disabled ? 0.5 : pressed ? 0.7 : 1 }]}>
    <View style={styles.flex}>
      <View style={styles.row}><BillingText style={[styles.rowTitle, { color: theme.foreground }]}>{planName(payment.planCode)}</BillingText><BillingText style={[styles.rowTitle, { color: theme.foreground }]}>{money(payment.amount)}</BillingText></View>
      <BillingText variant="caption">{dateTime(payment.createdAt)}</BillingText>
      <BillingBadge label={paymentStatus[payment.status]} pending={payment.status === 'PENDING'} neutral={payment.status === 'CANCELLED'} />
    </View>
    <SymbolView name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }} size={18} tintColor={theme.mutedForeground} />
  </Pressable>;
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: Spacing.two },
  flex: { flex: 1, minWidth: 0, gap: Spacing.one },
  heroFoot: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: Spacing.two, borderTopWidth: StyleSheet.hairlineWidth, paddingTop: Spacing.three },
  section: { gap: Spacing.three },
  sectionCopy: { gap: Spacing.one },
  plans: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  plan: { flexGrow: 1, flexBasis: 250, minWidth: 0, padding: Spacing.three, gap: 12 },
  welcomeSticker: { width: 64, height: 72 },
  heroStickerFrame: { width: 68, height: 76, borderRadius: Radius['3xl'], backgroundColor: BrandColors.cream, alignItems: 'center', justifyContent: 'center' },
  heroSticker: { width: 56, height: 68 },
  planStickerFrame: { width: 40, height: 44, borderRadius: Radius.xl, alignItems: 'center', justifyContent: 'center' },
  planSticker: { width: 34, height: 38 },
  history: { paddingVertical: Spacing.two, paddingHorizontal: Spacing.three, gap: 0 },
  historyRow: { minHeight: 100, flexDirection: 'row', alignItems: 'center', gap: Spacing.two, paddingVertical: Spacing.three, borderBottomWidth: StyleSheet.hairlineWidth },
  rowTitle: { fontFamily: Fonts.sansBold, fontSize: 16 },
  empty: { paddingVertical: Spacing.four, alignItems: 'center', gap: Spacing.two },
  centerText: { textAlign: 'center' },
});
