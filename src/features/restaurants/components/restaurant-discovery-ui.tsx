import type { PropsWithChildren } from 'react';
import { Image } from 'expo-image';
import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Fonts } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { RestaurantPin } from '../types/restaurant.schema';

export function DiscoveryWelcome() {
  const t = useTheme();
  return (
    <View style={[styles.hero, { backgroundColor: t.secondary }]}>
      <View style={styles.heroCopy}>
        <Text style={[styles.eyebrow, { color: t.secondaryForeground }]}>MỘT BỮA CHAY, MỘT NIỀM VUI</Text>
        <Text accessibilityRole="header" style={[styles.heroTitle, { color: t.secondaryForeground }]}>Tìm quán chay,{ '\n' }thêm vị mỗi ngày.</Text>
        <Text style={[styles.description, { color: t.secondaryForeground }]}>Khám phá quán, xem menu và chọn bữa ngon cho bạn.</Text>
      </View>
      <Image source={require('@/assets/branding/avocado-sticker.png')} contentFit="contain" accessible={false} style={styles.heroSticker} />
    </View>
  );
}

export function DiscoveryFilter({ label, icon, active, disabled, onPress }: { label: string; icon: SymbolViewProps['name']; active: boolean; disabled?: boolean; onPress: () => void }) {
  const t = useTheme();
  return (
    <Pressable accessibilityRole="button" accessibilityState={{ selected: active, disabled: !!disabled }} disabled={disabled} onPress={onPress} style={({ pressed }) => [styles.filter, { backgroundColor: active ? t.primary : t.card, borderColor: active ? t.primary : t.border, opacity: disabled || pressed ? 0.6 : 1 }]}>
      <SymbolView name={icon} size={18} tintColor={active ? t.primaryForeground : t.foreground} />
      <Text style={[styles.filterLabel, { color: active ? t.primaryForeground : t.foreground }]}>{label}</Text>
    </Pressable>
  );
}

export function DiscoveryHeading({ children, count }: PropsWithChildren<{ count: number }>) {
  const t = useTheme();
  return (
    <View style={styles.headingRow}>
      <Text accessibilityRole="header" style={[styles.sectionTitle, { color: t.foreground }]}>{children}</Text>
      <View style={[styles.count, { backgroundColor: t.secondary }]}><Text style={[styles.filterLabel, { color: t.secondaryForeground }]}>{count} quán</Text></View>
    </View>
  );
}

export function DiscoveryRestaurantCard({ restaurant: r, onOpen }: { restaurant: RestaurantPin; onOpen: () => void }) {
  const t = useTheme();
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`${r.name}. ${r.address}. Xem nhà hàng`} onPress={onOpen} style={({ pressed }) => [styles.card, { backgroundColor: t.card, borderColor: t.border, opacity: pressed ? 0.85 : 1 }]}>
      <View style={[styles.photoFrame, { backgroundColor: t.secondary }]}>
        {r.avatarUrl ? <Image source={r.avatarUrl} contentFit="cover" style={styles.photo} accessibilityLabel={`Ảnh nhà hàng ${r.name}`} /> : <View style={styles.placeholder}><Image source={require('@/assets/branding/tomato-sticker.png')} contentFit="contain" accessible={false} style={styles.placeholderSticker} /><Text style={[styles.filterLabel, { color: t.secondaryForeground }]}>Hẹn bạn một bữa chay ngon</Text></View>}
        {r.distanceMeters !== null && <View style={[styles.distance, { backgroundColor: t.card }]}><SymbolView name={{ ios: 'location.fill', android: 'near_me', web: 'near_me' }} size={13} tintColor={t.primary} /><Text style={[styles.filterLabel, { color: t.foreground }]}>{(r.distanceMeters / 1000).toFixed(1)} km</Text></View>}
      </View>
      <View style={styles.cardBody}>
        <View style={styles.headingRow}>
          <Text style={[styles.name, { color: t.foreground }]}>{r.name}</Text>
          <View style={[styles.rating, { backgroundColor: t.secondary }]}><SymbolView name={{ ios: 'star.fill', android: 'star', web: 'star' }} size={15} tintColor={t.primary} /><Text style={[styles.filterLabel, { color: t.secondaryForeground }]}>{r.averageRating === null ? 'Chưa có' : r.averageRating.toFixed(1)}</Text></View>
        </View>
        <View style={styles.addressRow}><SymbolView name={{ ios: 'mappin', android: 'location_on', web: 'location_on' }} size={16} tintColor={t.mutedForeground} /><Text numberOfLines={2} style={[styles.address, { color: t.mutedForeground }]}>{r.address}</Text></View>
        <View style={[styles.cardFooter, { borderColor: t.border }]}>
          <Text style={[styles.description, { color: t.mutedForeground }]}>{r.reviewCount ? `${r.reviewCount} đánh giá từ cộng đồng` : 'Khám phá menu của quán'}</Text>
          <View style={styles.link}><Text style={[styles.filterLabel, { color: t.primary }]}>Khám phá</Text><SymbolView name={{ ios: 'arrow.right', android: 'arrow_forward', web: 'arrow_forward' }} size={17} tintColor={t.primary} /></View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  hero: { borderRadius: 24, padding: 20, flexDirection: 'row', alignItems: 'center', gap: 8 },
  heroCopy: { flex: 1, gap: 10 },
  eyebrow: { fontFamily: Fonts.sansBold, fontSize: 10, letterSpacing: 1 },
  heroTitle: { fontFamily: Fonts.headingBold, fontSize: 24, lineHeight: 34 },
  description: { fontFamily: Fonts.sans, fontSize: 13, lineHeight: 19, flexShrink: 1 },
  heroSticker: { width: 72, height: 104, transform: [{ rotate: '8deg' }] },
  filter: { minHeight: 44, paddingVertical: 10, paddingHorizontal: 14, borderRadius: 24, borderWidth: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  filterLabel: { fontFamily: Fonts.sansSemibold, fontSize: 13 },
  headingRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  sectionTitle: { fontFamily: Fonts.headingBold, fontSize: 19, flex: 1 },
  count: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  card: { borderRadius: 22, borderWidth: 1, overflow: 'hidden' },
  photoFrame: { height: 188 },
  photo: { width: '100%', height: '100%' },
  placeholder: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 6 },
  placeholderSticker: { width: 82, height: 100 },
  distance: { position: 'absolute', top: 12, right: 12, borderRadius: 20, paddingVertical: 7, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', gap: 5 },
  cardBody: { padding: 16, gap: 12 },
  name: { fontFamily: Fonts.headingBold, fontSize: 19, lineHeight: 28, flex: 1 },
  rating: { paddingHorizontal: 9, paddingVertical: 6, borderRadius: 12, flexDirection: 'row', gap: 4, alignItems: 'center' },
  addressRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 5 },
  address: { flex: 1, fontFamily: Fonts.sans, fontSize: 14, lineHeight: 20 },
  cardFooter: { borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 },
  link: { flexDirection: 'row', alignItems: 'center', gap: 6 },
});
