import { router } from 'expo-router';
import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import type { PropsWithChildren, ReactNode } from 'react';
import { ActivityIndicator, Modal, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Fonts, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type IconName = SymbolViewProps['name'];

export function BillingLayout({ title, children, footer, onRefresh, refreshing = false }: PropsWithChildren<{
  title: string; footer?: ReactNode; onRefresh?: () => void; refreshing?: boolean;
}>) {
  const theme = useTheme();
  return <SafeAreaView style={[styles.screen, { backgroundColor: theme.background }]}>
    <View style={[styles.header, { borderColor: theme.border }]}>
      <Pressable accessibilityRole="button" accessibilityLabel="Quay lại" onPress={() => router.canGoBack() ? router.back() : router.replace('/me')} style={[styles.headerButton, { backgroundColor: theme.muted }]}>
        <SymbolView name={{ ios: 'chevron.left', android: 'arrow_back', web: 'arrow_back' }} size={20} tintColor={theme.foreground} />
      </Pressable>
      <Text accessibilityRole="header" style={[styles.title, { color: theme.foreground }]}>{title}</Text>
      {onRefresh ? <Pressable accessibilityRole="button" accessibilityLabel="Tải lại thông tin" accessibilityState={{ disabled: refreshing, busy: refreshing }} disabled={refreshing} onPress={onRefresh} style={styles.headerButton}>
        {refreshing ? <ActivityIndicator color={theme.primary} /> : <SymbolView name={{ ios: 'arrow.clockwise', android: 'refresh', web: 'refresh' }} size={21} tintColor={theme.primary} />}
      </Pressable> : <View style={styles.headerButton} />}
    </View>
    <ScrollView contentContainerStyle={styles.content} refreshControl={onRefresh ? <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} colors={[theme.primary]} /> : undefined}>
      {children}
    </ScrollView>
    {footer ? <View style={[styles.footer, { borderColor: theme.border, backgroundColor: theme.background }]}><View style={styles.footerContent}>{footer}</View></View> : null}
  </SafeAreaView>;
}

export function BillingCard({ children, accent, style }: PropsWithChildren<{ accent?: boolean; style?: StyleProp<ViewStyle> }>) {
  const theme = useTheme();
  return <View style={[styles.card, { backgroundColor: accent ? theme.secondary : theme.card }, !accent && styles.raised, style]}>{children}</View>;
}

export function BillingText({ children, heading, error, variant = 'body', style }: PropsWithChildren<{
  heading?: boolean; error?: boolean; variant?: 'body' | 'caption' | 'eyebrow' | 'price'; style?: StyleProp<TextStyle>;
}>) {
  const theme = useTheme();
  return <Text accessibilityRole={error ? 'alert' : heading ? 'header' : undefined} selectable style={[
    styles.copy, heading && styles.heading, variant === 'caption' && styles.caption, variant === 'eyebrow' && styles.eyebrow, variant === 'price' && styles.price,
    { color: error ? theme.destructive : heading || variant === 'price' ? theme.foreground : theme.mutedForeground }, style,
  ]}>{children}</Text>;
}

export function BillingButton({ label, onPress, disabled, secondary, quiet, busy, danger, icon }: {
  label: string; onPress: () => void; disabled?: boolean; secondary?: boolean; quiet?: boolean; busy?: boolean; danger?: boolean; icon?: IconName;
}) {
  const theme = useTheme();
  const inactive = !!disabled || !!busy;
  const color = danger ? theme.destructive : secondary || quiet ? theme.primary : theme.primaryForeground;
  return <Pressable accessibilityRole="button" accessibilityState={{ disabled: inactive, busy: !!busy }} disabled={inactive} onPress={onPress} style={({ pressed }) => [
    styles.button, { backgroundColor: quiet || danger ? 'transparent' : secondary ? theme.secondary : theme.primary, opacity: inactive ? 0.5 : pressed ? 0.8 : 1 },
  ]}>
    {busy ? <ActivityIndicator size="small" color={color} /> : icon ? <SymbolView name={icon} size={18} tintColor={color} /> : null}
    <Text style={[styles.buttonText, { color }]}>{label}</Text>
  </Pressable>;
}

export function BillingBadge({ label, pending, neutral }: { label: string; pending?: boolean; neutral?: boolean }) {
  const theme = useTheme();
  return <View style={[styles.badge, { backgroundColor: theme.muted }]}>
    <View style={[styles.dot, { backgroundColor: pending ? theme.chart3 : neutral ? theme.mutedForeground : theme.primary }]} />
    <Text style={[styles.badgeText, { color: theme.foreground }]}>{label}</Text>
  </View>;
}

export function BillingIcon({ name, large, neutral }: { name: IconName; large?: boolean; neutral?: boolean }) {
  const theme = useTheme();
  return <View style={[styles.icon, large && styles.largeIcon, { backgroundColor: neutral ? theme.muted : theme.secondary }]}><SymbolView name={name} size={large ? 30 : 22} tintColor={neutral ? theme.mutedForeground : theme.primary} /></View>;
}

export function BillingNotice({ title, children, error }: PropsWithChildren<{ title?: string; error?: boolean }>) {
  const theme = useTheme();
  return <View style={[styles.notice, { backgroundColor: theme.muted }]}>
    {title ? <Text accessibilityRole={error ? 'alert' : undefined} style={[styles.noticeTitle, { color: error ? theme.destructive : theme.foreground }]}>{title}</Text> : null}
    <BillingText error={error} variant="caption">{children}</BillingText>
  </View>;
}

export function BillingDetail({ label, value, emphasize, last }: { label: string; value: string; emphasize?: boolean; last?: boolean }) {
  const theme = useTheme();
  return <View style={[styles.detail, { borderColor: theme.border }, last && styles.detailLast]}>
    <Text style={[styles.detailLabel, { color: theme.mutedForeground }]}>{label}</Text>
    <Text selectable style={[styles.detailValue, { color: emphasize ? theme.primary : theme.foreground }, emphasize && styles.detailEmphasis]}>{value}</Text>
  </View>;
}

/** Numbered heading of a step card: the number badge and title share one centred row. */
export function BillingStep({ number, title }: { number: number; title: string }) {
  const theme = useTheme();
  return <View style={styles.step}>
    <View style={[styles.stepNumber, { backgroundColor: theme.primary }]}><Text style={[styles.stepNumberText, { color: theme.primaryForeground }]}>{number}</Text></View>
    <BillingText heading style={styles.stepTitle}>{title}</BillingText>
  </View>;
}

/** Section title with an optional caption underneath. */
export function BillingSectionTitle({ title, caption }: { title: string; caption?: string }) {
  return <View style={styles.sectionTitle}>
    <BillingText heading style={styles.sectionHeading}>{title}</BillingText>
    {caption ? <BillingText variant="caption">{caption}</BillingText> : null}
  </View>;
}

export function BillingLoading() {
  const theme = useTheme();
  return <View style={styles.loading}><ActivityIndicator color={theme.primary} /><BillingText>Đang tải thông tin…</BillingText></View>;
}

export function BillingConfirm({ visible, title, children, onClose }: PropsWithChildren<{ visible: boolean; title: string; onClose: () => void }>) {
  const theme = useTheme();
  return <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
    <View style={styles.overlay}><SafeAreaView edges={['bottom']} accessibilityViewIsModal style={[styles.dialog, { backgroundColor: theme.background }]}>
      <View style={[styles.handle, { backgroundColor: theme.border }]} />
      <ScrollView contentContainerStyle={styles.dialogContent}><BillingText heading>{title}</BillingText>{children}</ScrollView>
    </SafeAreaView></View>
  </Modal>;
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', minHeight: 68, paddingHorizontal: Spacing.three, borderBottomWidth: StyleSheet.hairlineWidth, gap: Spacing.two },
  headerButton: { width: 44, height: 44, borderRadius: Radius.xl, alignItems: 'center', justifyContent: 'center' },
  title: { flex: 1, fontFamily: Fonts.headingBold, fontSize: 19, textAlign: 'center' },
  content: { width: '100%', maxWidth: 680, alignSelf: 'center', padding: Spacing.three, gap: Spacing.three + Spacing.one, paddingBottom: Spacing.five },
  footer: { borderTopWidth: StyleSheet.hairlineWidth, paddingHorizontal: Spacing.three, paddingVertical: 12 },
  footerContent: { width: '100%', maxWidth: 648, alignSelf: 'center', gap: Spacing.two },
  raised: { shadowColor: '#14261a', shadowOpacity: 0.07, shadowRadius: 10, shadowOffset: { width: 0, height: 2 }, elevation: 1 },
  card: { borderRadius: Radius['3xl'], padding: Spacing.three + Spacing.one, gap: Spacing.three },
  heading: { fontFamily: Fonts.headingBold, fontSize: 20, lineHeight: 28 },
  copy: { fontFamily: Fonts.sans, fontSize: 15, lineHeight: 23 },
  caption: { fontSize: 13, lineHeight: 20 },
  eyebrow: { fontFamily: Fonts.sansSemibold, fontSize: 12, lineHeight: 18, letterSpacing: 1 },
  price: { fontFamily: Fonts.headingBold, fontSize: 30, lineHeight: 42 },
  button: { minHeight: 50, paddingVertical: 12, paddingHorizontal: Spacing.three, borderRadius: Radius.xl, flexDirection: 'row', gap: Spacing.two, justifyContent: 'center', alignItems: 'center' },
  buttonText: { flexShrink: 1, fontFamily: Fonts.sansBold, fontSize: 15, lineHeight: 21, textAlign: 'center' },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 99, paddingHorizontal: 10, paddingVertical: 5, alignSelf: 'flex-start', flexShrink: 1 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  badgeText: { flexShrink: 1, fontFamily: Fonts.sansSemibold, fontSize: 12, lineHeight: 18 },
  icon: { width: 44, height: 44, borderRadius: Radius.xl, alignItems: 'center', justifyContent: 'center' },
  largeIcon: { width: 64, height: 64, borderRadius: 24 },
  notice: { padding: Spacing.three, gap: Spacing.one, borderRadius: Radius.xl },
  noticeTitle: { fontFamily: Fonts.sansBold, fontSize: 14, lineHeight: 21 },
  detail: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.three, paddingVertical: Spacing.two + Spacing.one, borderBottomWidth: StyleSheet.hairlineWidth },
  detailLast: { borderBottomWidth: 0 },
  detailLabel: { flexShrink: 0, maxWidth: '40%', fontFamily: Fonts.sans, fontSize: 13, lineHeight: 19 },
  detailValue: { flex: 1, minWidth: 0, textAlign: 'right', fontFamily: Fonts.sansSemibold, fontSize: 15, lineHeight: 22 },
  detailEmphasis: { fontFamily: Fonts.sansBold, fontSize: 16 },
  step: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two + Spacing.one },
  stepNumber: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  stepNumberText: { fontFamily: Fonts.sansBold, fontSize: 14, lineHeight: 18 },
  stepTitle: { flex: 1, fontSize: 17, lineHeight: 24 },
  sectionTitle: { gap: 2 },
  sectionHeading: { fontSize: 18, lineHeight: 26 },
  loading: { padding: Spacing.four, alignItems: 'center', gap: 12 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  dialog: { width: '100%', maxWidth: 680, maxHeight: '90%', alignSelf: 'center', borderTopLeftRadius: Radius['4xl'], borderTopRightRadius: Radius['4xl'], overflow: 'hidden' },
  handle: { width: 36, height: 4, borderRadius: 2, alignSelf: 'center', marginTop: 12 },
  dialogContent: { padding: Spacing.four, gap: Spacing.three },
});
