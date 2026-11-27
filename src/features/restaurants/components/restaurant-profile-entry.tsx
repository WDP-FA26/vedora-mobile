import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { Fonts, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useSessionStore } from '@/shared/stores/session-store';
import { usePageAccount } from '../hooks/use-page-account';
import { Action, Copy, Notice } from './restaurant-ui';

export function RestaurantProfileEntry() {
  const theme = useTheme();
  const actor = useSessionStore((state) => state.actor);
  const account = usePageAccount();
  return (
    <View style={styles.section}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Nhà hàng của tôi. Quản lý Trang, menu và thành viên"
        onPress={() => router.push('/pages')}
        style={({ pressed }) => [styles.card, { backgroundColor: theme.card, borderColor: theme.border, opacity: pressed ? 0.8 : 1 }]}
      >
        <View style={[styles.stickerFrame, { backgroundColor: theme.secondary }]}>
          <Image source={require('@/assets/branding/tomato-sticker.png')} contentFit="contain" accessible={false} style={styles.sticker} />
        </View>
        <View style={styles.copy}>
          <Text style={[styles.title, { color: theme.foreground }]}>Nhà hàng của tôi</Text>
          <Text style={[styles.subtitle, { color: theme.mutedForeground }]}>Chăm chút Trang, menu và đội ngũ của bạn</Text>
        </View>
        <SymbolView name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }} size={20} tintColor={theme.primary} />
      </Pressable>
      {actor && (
        <View style={[styles.account, { backgroundColor: theme.muted }]}>
          <Copy>Bạn đang hoạt động dưới tên Trang nhà hàng.</Copy>
          <Action
            label={account.isPending ? 'Đang chuyển…' : `Về @${actor.username}`}
            disabled={account.isPending}
            onPress={() => account.mutate(null)}
          />
        </View>
      )}
      <Notice error={account.error} />
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginHorizontal: Spacing.three, gap: Spacing.three },
  card: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, padding: Spacing.three, minHeight: 96, borderWidth: 1, borderRadius: Radius['3xl'] },
  stickerFrame: { width: 56, height: 60, borderRadius: Radius['2xl'], alignItems: 'center', justifyContent: 'center' },
  sticker: { width: 56, height: 62 },
  copy: { flex: 1, gap: Spacing.one },
  title: { fontFamily: Fonts.sansBold, fontSize: 16 },
  subtitle: { fontFamily: Fonts.sans, fontSize: 13, lineHeight: 19 },
  account: { borderRadius: Radius['2xl'], padding: Spacing.three, gap: Spacing.two },
});
