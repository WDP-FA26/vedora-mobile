import { Image } from 'expo-image';
import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { BrandColors, Fonts, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { ApiError } from '@/shared/api/api-error';
import { useSessionStore } from '@/shared/stores/session-store';

import { useBilling, useBillingActions } from '../hooks/use-billing';
import type { Payment, Plan } from '../types/billing.schema';
import { dateTime, money, paymentStatus, planName } from '../utils/billing-format';
import { BillingBadge, BillingButton, BillingCard, BillingConfirm, BillingIcon, BillingLayout, BillingLoading, BillingNotice, BillingSectionTitle, BillingText } from './billing-ui';

const purchaseTerms = 'Gói mới bắt đầu ngay khi hệ thống xác nhận thanh toán và thay thế gói cũ. Thời gian còn lại của gói cũ không được cộng dồn hay quy đổi thành tiền. Mỗi ngày tính 24 giờ.';

export function BillingScreen() {
  const token = useSessionStore((state) => state.accessToken);
  if (!token) return <BillingLayout title="Gói của bạn"><BillingCard>
    <Image source={require('@/assets/branding/carrot-sticker.png')} contentFit="contain" style={styles.welcomeSticker} accessible={false} />
    <BillingText heading>Đăng nhập để xem gói của bạn</BillingText>
    <BillingText>Bạn sẽ thấy gói đang dùng, lịch sử thanh toán và mua gói ngay tại đây.</BillingText>
    <BillingButton label="Đăng nhập" onPress={() => router.push({ pathname: '/login', params: { returnTo: '/billing' } })} />
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
        : 'Chưa tạo được giao dịch. Hãy kiểm tra giao dịch đang chờ hoặc thử lại. Đừng chuyển tiền khi chưa có thông tin thanh toán.');
    } finally { lock.current = false; }
  }
  function refresh() { if (!busy) { void catalog.refetch(); void overview.refetch(); } }
  return <BillingLayout title="Gói của bạn" refreshing={catalog.isFetching || overview.isFetching || busy} onRefresh={refresh}>
    {loading ? <BillingLoading /> : null}
    {unavailable ? <BillingNotice error title="Chưa tải được thông tin">Kéo xuống hoặc bấm biểu tượng làm mới để thử lại. Phải tải xong mới mua được gói.</BillingNotice> : null}
    {error ? <BillingNotice error title="Chưa thể tạo thanh toán">{error}</BillingNotice> : null}
    {data ? <>
      <View style={[styles.hero, { backgroundColor: theme.primary }]}>
        <View style={styles.heroTop}>
          <View style={styles.heroCopy}>
            <Text style={[styles.heroEyebrow, { color: theme.primaryForeground }]}>GÓI HIỆN TẠI</Text>
            <Text style={[styles.heroPlan, { color: theme.primaryForeground }]}>{planName(data.membership.planCode)}</Text>
            {data.membership.planCode === 'FREE'
              ? <Text style={[styles.heroText, { color: theme.primaryForeground }]}>Bạn đang dùng gói miễn phí.</Text>
              : <View style={[styles.heroPill, { backgroundColor: theme.primaryForeground }]}>
                <View style={[styles.heroDot, { backgroundColor: theme.primary }]} />
                <Text style={[styles.heroPillText, { color: theme.primary }]}>Đang có hiệu lực</Text>
              </View>}
          </View>
          <View style={styles.heroStickerFrame}><Image source={require('@/assets/branding/carrot-sticker.png')} contentFit="contain" style={styles.heroSticker} accessible={false} /></View>
        </View>
        {data.membership.planCode !== 'FREE' && (data.membership.startsAt || data.membership.expiresAt) ? <View style={[styles.heroMeta, { borderColor: theme.primaryForeground }]}>
          {data.membership.startsAt ? <View style={styles.heroMetaItem}><Text style={[styles.heroMetaLabel, { color: theme.primaryForeground }]}>Bắt đầu</Text><Text style={[styles.heroMetaValue, { color: theme.primaryForeground }]}>{dateTime(data.membership.startsAt)}</Text></View> : null}
          {data.membership.expiresAt ? <View style={styles.heroMetaItem}><Text style={[styles.heroMetaLabel, { color: theme.primaryForeground }]}>Hết hạn</Text><Text style={[styles.heroMetaValue, { color: theme.primaryForeground }]}>{dateTime(data.membership.expiresAt)}</Text></View> : null}
        </View> : null}
        <View style={styles.heroFoot}>
          <SymbolView name={{ ios: 'checkmark.shield', android: 'verified_user', web: 'verified_user' }} size={15} tintColor={theme.primaryForeground} />
          <Text style={[styles.heroFootText, { color: theme.primaryForeground }]}>Không tự gia hạn, không tự trừ tiền · Giờ Việt Nam</Text>
        </View>
      </View>
      {pending ? <View style={[styles.pending, { backgroundColor: theme.card }]}>
        <View style={styles.pendingTop}>
          <View style={[styles.pendingIcon, { backgroundColor: theme.muted }]}><SymbolView name={{ ios: 'clock', android: 'schedule', web: 'schedule' }} size={20} tintColor={theme.chart3} /></View>
          <View style={styles.flex}>
            <BillingBadge pending label="Đang chờ thanh toán" />
            <BillingText heading style={styles.pendingTitle}>{planName(pending.planCode)} · {money(pending.amount)}</BillingText>
          </View>
        </View>
        <BillingText variant="caption">Hãy tiếp tục hoặc hủy giao dịch này trước khi mua gói khác.</BillingText>
        <BillingButton label="Tiếp tục thanh toán" icon={{ ios: 'arrow.right', android: 'arrow_forward', web: 'arrow_forward' }} onPress={() => router.push({ pathname: '/payment/[id]', params: { id: pending.id } })} />
      </View> : null}
    </> : null}
    {catalog.data ? <View style={styles.section}>
      <BillingSectionTitle title="Các gói" caption="Trả một lần bằng chuyển khoản, không tự gia hạn." />
      <BillingNotice title="Lưu ý">Pro và Premium hiện mới ghi nhận gói bạn đã mua, chưa kèm quyền lợi thêm.</BillingNotice>
      {!catalog.data.paymentsEnabled ? <BillingNotice title="Tạm thời chưa mua được gói">Bạn vẫn xem được gói và lịch sử. Hãy quay lại sau.</BillingNotice> : null}
      <View style={styles.plans}>
        {catalog.data.plans.map((plan) => <BillingCard key={plan.code} style={styles.plan}>
          <View style={styles.planTop}>
            <View style={[styles.planStickerFrame, { backgroundColor: plan.code === 'PRO' ? theme.secondary : theme.muted }]}>
              <Image source={plan.code === 'PRO' ? require('@/assets/branding/avocado-sticker.png') : require('@/assets/branding/tomato-sticker.png')} contentFit="contain" style={styles.planSticker} accessible={false} />
            </View>
            <BillingText heading style={styles.planName}>{plan.name}</BillingText>
            <BillingBadge neutral label={`${plan.durationDays} ngày`} />
          </View>
          <View style={styles.planPrice}><BillingText variant="price" style={styles.priceText}>{money(plan.priceVnd)}</BillingText><BillingText variant="caption">Trả một lần, không tự gia hạn</BillingText></View>
          <BillingButton label={`Chọn ${plan.name}`} secondary disabled={busy || loading || unavailable || !!pending || !catalog.data.paymentsEnabled} onPress={() => { setError(''); setSelected(plan); }} />
        </BillingCard>)}
      </View>
      <BillingText variant="caption">Gói mới thay thế gói cũ, thời gian còn lại không được cộng dồn. Hết hạn, tài khoản về gói Miễn phí.</BillingText>
    </View> : null}
    {data ? <View style={styles.section}>
      <BillingSectionTitle title="Lịch sử thanh toán" caption="20 giao dịch gần nhất" />
      <BillingCard style={styles.history}>
        {!data.recentPayments.length ? <View style={styles.empty}>
          <BillingIcon name={{ ios: 'doc.text', android: 'receipt_long', web: 'receipt_long' }} />
          <BillingText heading>Chưa có giao dịch</BillingText><BillingText style={styles.centerText}>Các lần thanh toán sẽ hiện ở đây.</BillingText>
        </View> : data.recentPayments.slice(0, showAll ? 20 : 5).map((payment, index, list) => <PaymentRow key={payment.id} payment={payment} disabled={busy} last={index === list.length - 1 && data.recentPayments.length <= 5} />)}
        {data.recentPayments.length > 5 ? <BillingButton quiet label={showAll ? 'Thu gọn lịch sử' : `Xem tất cả (${data.recentPayments.length})`} onPress={() => setShowAll(!showAll)} /> : null}
      </BillingCard>
    </View> : null}
    <BillingConfirm visible={!!selected} title="Xác nhận mua gói" onClose={() => { if (!busy) setSelected(null); }}>
      {selected ? <BillingCard accent>
        <View style={styles.planTop}><BillingText heading style={styles.planName}>{selected.name}</BillingText><Image source={selected.code === 'PRO' ? require('@/assets/branding/avocado-sticker.png') : require('@/assets/branding/tomato-sticker.png')} contentFit="contain" style={styles.planSticker} accessible={false} /></View>
        <BillingText variant="price" style={styles.priceText}>{money(selected.priceVnd)}</BillingText><BillingText>{selected.durationDays} ngày · Trả một lần</BillingText>
      </BillingCard> : null}
      <BillingNotice title="Về thời hạn">{purchaseTerms}</BillingNotice>
      <BillingText>Gói hiện chưa kèm quyền lợi thêm. Bước sau sẽ hiện mã QR và thông tin chuyển khoản.</BillingText>
      <BillingButton label="Tiếp tục" busy={busy} onPress={() => void purchase()} />
      <BillingButton quiet label="Chọn gói khác" disabled={busy} onPress={() => setSelected(null)} />
    </BillingConfirm>
  </BillingLayout>;
}

function PaymentRow({ payment, disabled, last }: { payment: Payment; disabled: boolean; last: boolean }) {
  const theme = useTheme();
  return <Pressable accessibilityRole="button" accessibilityLabel={`${planName(payment.planCode)}, ${money(payment.amount)}, ${paymentStatus[payment.status]}, ${dateTime(payment.createdAt)}. Xem chi tiết`} disabled={disabled} onPress={() => router.push({ pathname: '/payment/[id]', params: { id: payment.id } })} style={({ pressed }) => [styles.historyRow, { borderColor: theme.border, opacity: disabled ? 0.5 : pressed ? 0.7 : 1 }, last && styles.historyRowLast]}>
    <View style={styles.historyLeft}>
      <Text style={[styles.rowTitle, { color: theme.foreground }]}>{planName(payment.planCode)}</Text>
      <BillingText variant="caption">{dateTime(payment.createdAt)}</BillingText>
    </View>
    <View style={styles.historyRight}>
      <Text style={[styles.rowTitle, { color: theme.foreground }]}>{money(payment.amount)}</Text>
      <BillingBadge label={paymentStatus[payment.status]} pending={payment.status === 'PENDING'} neutral={payment.status === 'CANCELLED'} />
    </View>
    <SymbolView name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }} size={16} tintColor={theme.mutedForeground} />
  </Pressable>;
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0, gap: Spacing.one },
  centerText: { textAlign: 'center' },
  hero: { borderRadius: Radius['3xl'], padding: Spacing.three + Spacing.one, gap: Spacing.three },
  heroTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.three },
  heroCopy: { flex: 1, minWidth: 0, gap: Spacing.one + Spacing.half },
  heroEyebrow: { fontFamily: Fonts.sansBold, fontSize: 11, lineHeight: 16, letterSpacing: 1.2, opacity: 0.8 },
  heroPlan: { fontFamily: Fonts.headingBold, fontSize: 32, lineHeight: 42 },
  heroText: { fontFamily: Fonts.sans, fontSize: 14, lineHeight: 21, opacity: 0.9 },
  heroPill: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 99, paddingHorizontal: 10, paddingVertical: 4 },
  heroDot: { width: 6, height: 6, borderRadius: 3 },
  heroPillText: { fontFamily: Fonts.sansBold, fontSize: 12, lineHeight: 18 },
  heroStickerFrame: { width: 72, height: 80, borderRadius: Radius['3xl'], backgroundColor: BrandColors.cream, alignItems: 'center', justifyContent: 'center' },
  heroSticker: { width: 56, height: 68 },
  heroMeta: { flexDirection: 'row', gap: Spacing.three, borderTopWidth: StyleSheet.hairlineWidth, paddingTop: Spacing.three },
  heroMetaItem: { flex: 1, minWidth: 0, gap: 2 },
  heroMetaLabel: { fontFamily: Fonts.sans, fontSize: 12, lineHeight: 17, opacity: 0.75 },
  heroMetaValue: { fontFamily: Fonts.sansBold, fontSize: 14, lineHeight: 20 },
  heroFoot: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  heroFootText: { flex: 1, fontFamily: Fonts.sans, fontSize: 12, lineHeight: 18, opacity: 0.85 },
  pending: { borderRadius: Radius['3xl'], padding: Spacing.three + Spacing.one, gap: Spacing.three, shadowColor: '#14261a', shadowOpacity: 0.07, shadowRadius: 10, shadowOffset: { width: 0, height: 2 }, elevation: 1 },
  pendingTop: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  pendingIcon: { width: 44, height: 44, borderRadius: Radius.xl, alignItems: 'center', justifyContent: 'center' },
  pendingTitle: { fontSize: 17, lineHeight: 24 },
  section: { gap: Spacing.three },
  plans: { gap: Spacing.three },
  plan: { gap: Spacing.three },
  planTop: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two + Spacing.one },
  planName: { flex: 1, minWidth: 0 },
  planPrice: { gap: 2 },
  priceText: { fontSize: 28, lineHeight: 38 },
  welcomeSticker: { width: 64, height: 72 },
  planStickerFrame: { width: 44, height: 48, borderRadius: Radius.xl, alignItems: 'center', justifyContent: 'center' },
  planSticker: { width: 34, height: 38 },
  history: { paddingVertical: Spacing.one, paddingHorizontal: Spacing.three, gap: 0 },
  historyRow: { minHeight: 76, flexDirection: 'row', alignItems: 'center', gap: Spacing.three, paddingVertical: Spacing.three - Spacing.one, borderBottomWidth: StyleSheet.hairlineWidth },
  historyRowLast: { borderBottomWidth: 0 },
  historyLeft: { flex: 1, minWidth: 0, gap: Spacing.half },
  historyRight: { alignItems: 'flex-end', gap: Spacing.one + Spacing.half },
  rowTitle: { fontFamily: Fonts.sansBold, fontSize: 16, lineHeight: 22 },
  empty: { paddingVertical: Spacing.four, alignItems: 'center', gap: Spacing.two },
});
