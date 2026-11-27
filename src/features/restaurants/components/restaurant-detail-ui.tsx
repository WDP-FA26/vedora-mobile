import { Image } from 'expo-image';
import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Fonts } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export function RestaurantHero({ name, username, cover, avatar, bio }: { name: string; username: string; cover: string | null; avatar: string | null; bio: string | null }) {
  const t = useTheme();
  return (
    <View style={[styles.hero, { backgroundColor: t.card, borderColor: t.border }]}>
      <View style={[styles.cover, { backgroundColor: t.secondary }]}>
        {cover ? <Image source={cover} style={StyleSheet.absoluteFill} contentFit="cover" accessibilityLabel={`Ảnh bìa ${name}`} /> : <View style={styles.fallback}><Image source={require('@/assets/branding/avocado-sticker.png')} contentFit="contain" accessible={false} style={styles.sticker} /><Text style={[styles.fallbackText, { color: t.secondaryForeground }]}>Một điểm hẹn, nhiều vị chay</Text></View>}
      </View>
      <View style={styles.identity}>
        <View style={[styles.avatarFrame, { backgroundColor: t.card, borderColor: t.card }]}>
          {avatar ? <Image source={avatar} contentFit="cover" style={styles.avatar} accessibilityLabel={`Ảnh đại diện ${name}`} /> : <SymbolView name={{ ios: 'storefront', android: 'storefront', web: 'storefront' }} size={30} tintColor={t.primary} />}
        </View>
        <Text accessibilityRole="header" style={[styles.name, { color: t.foreground }]}>{name}</Text>
        <Text style={[styles.meta, { color: t.mutedForeground }]}>@{username}</Text>
        {bio && <Text style={[styles.bio, { color: t.foreground }]}>{bio}</Text>}
      </View>
    </View>
  );
}

export function RestaurantQuickAction({ label, icon, onPress }: { label: string; icon: SymbolViewProps['name']; onPress: () => void }) {
  const t = useTheme();
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.quickAction, { backgroundColor: t.secondary, opacity: pressed ? 0.7 : 1 }]}>
      <SymbolView name={icon} size={22} tintColor={t.secondaryForeground} />
      <Text style={[styles.quickLabel, { color: t.secondaryForeground }]}>{label}</Text>
    </Pressable>
  );
}

export function RestaurantDish({ name, image, price, available, description }: { name: string; image: string | null; price: number | null; available: boolean; description: string | null }) {
  const t = useTheme();
  return (
    <View style={[styles.dish, { backgroundColor: t.card, borderColor: t.border }]}>
      <View style={[styles.dishImage, { backgroundColor: t.secondary }]}>
        {image ? <Image source={image} contentFit="cover" style={StyleSheet.absoluteFill} accessibilityLabel={name} /> : <SymbolView name={{ ios: 'fork.knife', android: 'restaurant', web: 'restaurant' }} size={30} tintColor={t.primary} />}
      </View>
      <View style={styles.dishCopy}>
        <Text style={[styles.dishName, { color: t.foreground }]}>{name}</Text>
        {description && <Text style={[styles.meta, { color: t.mutedForeground }]}>{description}</Text>}
        <Text style={[styles.price, { color: t.primary }]}>{price === null ? 'Liên hệ giá' : `${price.toLocaleString('vi-VN')} đ`}</Text>
        {!available && <Text style={[styles.meta, { color: t.mutedForeground }]}>Tạm hết món</Text>}
      </View>
    </View>
  );
}

export function RestaurantRatingBar({ star, count, total }: { star: number; count: number; total: number }) {
  const t = useTheme();
  return (
    <View accessibilityLabel={`${star} sao: ${count} đánh giá`} style={styles.barRow}>
      <Text style={[styles.barLabel, { color: t.mutedForeground }]}>{star} ★</Text>
      <View style={[styles.barTrack, { backgroundColor: t.muted }]}><View style={{ height: '100%', width: `${total ? Math.min(100, count / total * 100) : 0}%`, backgroundColor: t.primary, borderRadius: 4 }} /></View>
      <Text style={[styles.barCount, { color: t.mutedForeground }]}>{count}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { borderRadius: 24, borderWidth: 1, overflow: 'hidden' },
  cover: { height: 190 },
  fallback: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 6 },
  sticker: { width: 74, height: 88 },
  fallbackText: { fontFamily: Fonts.sansSemibold, fontSize: 14 },
  identity: { padding: 20, paddingTop: 0, gap: 8 },
  avatarFrame: { marginTop: -28, width: 72, height: 72, borderRadius: 22, borderWidth: 4, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  avatar: { width: '100%', height: '100%' },
  name: { fontFamily: Fonts.headingBold, fontSize: 25, lineHeight: 35 },
  meta: { fontFamily: Fonts.sans, fontSize: 13, lineHeight: 19 },
  bio: { fontFamily: Fonts.sans, fontSize: 15, lineHeight: 23, marginTop: 4 },
  quickAction: { flexGrow: 1, flexBasis: 90, minHeight: 76, borderRadius: 16, gap: 8, alignItems: 'center', justifyContent: 'center', padding: 12 },
  quickLabel: { fontFamily: Fonts.sansSemibold, fontSize: 13 },
  dish: { flexDirection: 'row', padding: 12, gap: 14, borderRadius: 18, borderWidth: 1, alignItems: 'flex-start' },
  dishImage: { width: 88, height: 96, borderRadius: 12, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  dishCopy: { flex: 1, gap: 6 },
  dishName: { fontFamily: Fonts.sansBold, fontSize: 17, lineHeight: 23 },
  price: { fontFamily: Fonts.sansBold, fontSize: 16 },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  barLabel: { width: 30, fontFamily: Fonts.sansSemibold, fontSize: 13 },
  barTrack: { flex: 1, height: 7, borderRadius: 4, overflow: 'hidden' },
  barCount: { minWidth: 26, textAlign: 'right', fontFamily: Fonts.sans, fontSize: 13 },
});
