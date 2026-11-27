import type { PropsWithChildren } from 'react';
import { Image } from 'expo-image';
import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { BrandColors, Fonts } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { WORKSPACE_STATUS_LABELS, type Workspace, type WorkspaceDetail } from '../types/restaurant.schema';

export function WorkspaceStatus({ status }: { status: Workspace['status'] }) {
  const t = useTheme();
  const color = status === 'REJECTED' ? t.destructive : status === 'APPROVED' ? t.primary : t.foreground;
  return (
    <View style={[styles.badge, { backgroundColor: status === 'PENDING' ? `${BrandColors.orange}20` : status === 'REJECTED' ? `${t.destructive}12` : t.secondary }]}>
      <SymbolView name={status === 'APPROVED' ? { ios: 'checkmark.seal.fill', android: 'verified', web: 'verified' } : status === 'PENDING' ? { ios: 'clock', android: 'schedule', web: 'schedule' } : { ios: 'exclamationmark.circle', android: 'error_outline', web: 'error_outline' }} size={15} tintColor={color} />
      <Text style={[styles.badgeLabel, { color }]}>{WORKSPACE_STATUS_LABELS[status]}</Text>
    </View>
  );
}

export function WorkspacePageCard({ page, onPress }: { page: Workspace; onPress: () => void }) {
  const t = useTheme();
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`Quản lý Trang ${page.name}, ${WORKSPACE_STATUS_LABELS[page.status]}`} onPress={onPress} style={({ pressed }) => [styles.card, { backgroundColor: t.card, borderColor: t.border, opacity: pressed ? 0.75 : 1 }]}>
      <View style={styles.row}>
        <View style={[styles.avatar, { backgroundColor: t.secondary }]}>
          {page.avatarUrl ? <Image source={page.avatarUrl} contentFit="cover" style={StyleSheet.absoluteFill} accessibilityLabel={`Ảnh ${page.name}`} /> : <Image source={require('@/assets/branding/tomato-sticker.png')} contentFit="contain" accessible={false} style={styles.avatarSticker} />}
        </View>
        <View style={styles.copy}>
          <Text style={[styles.name, { color: t.foreground }]}>{page.name}</Text>
          <Text style={[styles.meta, { color: t.mutedForeground }]}>@{page.username}</Text>
        </View>
      </View>
      <View style={styles.wrap}>
        <WorkspaceStatus status={page.status} />
        <Text style={[styles.meta, { color: t.mutedForeground }]}>{page.role === 'OWNER' ? 'Chủ Trang' : 'Quản lý'}</Text>
      </View>
      <View style={styles.row}>
        <SymbolView name={{ ios: 'mappin', android: 'location_on', web: 'location_on' }} size={17} tintColor={t.mutedForeground} />
        <Text numberOfLines={2} style={[styles.address, { color: t.mutedForeground }]}>{page.address}</Text>
      </View>
      {page.status === 'REJECTED' && page.reviewNote && <Text style={[styles.meta, { color: t.destructive }]}>{page.reviewNote}</Text>}
      <View style={[styles.footer, { borderColor: t.border }]}>
        <Text style={[styles.link, { color: t.primary }]}>Quản lý Trang</Text>
        <View style={[styles.arrow, { backgroundColor: t.secondary }]}><SymbolView name={{ ios: 'arrow.up.right', android: 'north_east', web: 'north_east' }} size={19} tintColor={t.primary} /></View>
      </View>
    </Pressable>
  );
}

export function WorkspaceIdentity({ page, children }: PropsWithChildren<{ page: WorkspaceDetail }>) {
  const t = useTheme();
  return (
    <View style={[styles.identity, { backgroundColor: t.card, borderColor: t.border }]}>
      <View style={[styles.banner, { backgroundColor: t.secondary }]}>
        <Text style={[styles.eyebrow, { color: t.secondaryForeground }]}>GÓC QUẢN LÝ NHÀ HÀNG</Text>
        <Image source={require('@/assets/branding/carrot-sticker.png')} contentFit="contain" accessible={false} style={styles.bannerSticker} />
      </View>
      <View style={styles.identityBody}>
        <View style={styles.identityTop}>
          <View style={[styles.largeAvatar, { backgroundColor: t.secondary, borderColor: t.card }]}>
            {page.avatarUrl ? <Image source={page.avatarUrl} contentFit="cover" style={StyleSheet.absoluteFill} accessibilityLabel={`Ảnh ${page.name}`} /> : <SymbolView name={{ ios: 'storefront', android: 'storefront', web: 'storefront' }} size={30} tintColor={t.primary} />}
          </View>
          <WorkspaceStatus status={page.status} />
        </View>
        <Text accessibilityRole="header" style={[styles.identityName, { color: t.foreground }]}>{page.name}</Text>
        <Text style={[styles.meta, { color: t.mutedForeground }]}>@{page.username} · {page.role === 'OWNER' ? 'Chủ Trang' : 'Quản lý'}</Text>
        {page.bio && <Text numberOfLines={2} style={[styles.address, { color: t.mutedForeground }]}>{page.bio}</Text>}
        <View style={[styles.facts, { backgroundColor: t.background, borderColor: t.border }]}>
          <View style={styles.fact}>
            <Text style={[styles.factValue, { color: t.foreground }]}>{page.members.length}</Text>
            <Text style={[styles.meta, { color: t.mutedForeground }]}>Thành viên</Text>
          </View>
          <View style={[styles.factDivider, { backgroundColor: t.border }]} />
          <View style={styles.fact}>
            <SymbolView name={{ ios: 'mappin.and.ellipse', android: 'location_on', web: 'location_on' }} size={18} tintColor={t.primary} />
            <Text numberOfLines={1} style={[styles.meta, { color: t.mutedForeground, flexShrink: 1 }]}>{page.ward ?? 'Địa điểm quán'}</Text>
          </View>
        </View>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { padding: 18, borderWidth: 1, borderRadius: 24, gap: 14 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 10 },
  copy: { flex: 1, gap: 4 },
  avatar: { width: 64, height: 64, borderRadius: 20, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  avatarSticker: { width: 42, height: 48 },
  name: { fontFamily: Fonts.headingBold, fontSize: 18, lineHeight: 27 },
  meta: { fontFamily: Fonts.sans, fontSize: 13, lineHeight: 19 },
  address: { flexShrink: 1, fontFamily: Fonts.sans, fontSize: 14, lineHeight: 21 },
  badge: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 7, paddingHorizontal: 10, borderRadius: 12 },
  badgeLabel: { fontFamily: Fonts.sansSemibold, fontSize: 12 },
  footer: { borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  link: { fontFamily: Fonts.sansBold, fontSize: 14 },
  arrow: { width: 34, height: 34, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  identity: { borderRadius: 26, borderWidth: 1, overflow: 'hidden' },
  banner: { minHeight: 80, padding: 18, justifyContent: 'flex-start', paddingRight: 96 },
  eyebrow: { fontFamily: Fonts.sansBold, fontSize: 10, letterSpacing: 1.2 },
  bannerSticker: { position: 'absolute', right: 22, top: 2, width: 52, height: 72, transform: [{ rotate: '14deg' }] },
  identityBody: { padding: 18, paddingTop: 0, gap: 10 },
  identityTop: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  largeAvatar: { width: 64, height: 64, borderRadius: 22, borderWidth: 4, marginTop: -22, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  identityName: { fontFamily: Fonts.headingBold, fontSize: 22, lineHeight: 32 },
  facts: { borderWidth: 1, borderRadius: 16, paddingVertical: 12, flexDirection: 'row', alignItems: 'center' },
  fact: { flex: 1, flexDirection: 'row', paddingHorizontal: 12, alignItems: 'center', justifyContent: 'center', gap: 6 },
  factValue: { fontFamily: Fonts.headingBold, fontSize: 18 },
  factDivider: { width: 1, height: 24 },
});
