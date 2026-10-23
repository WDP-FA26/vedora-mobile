import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Fonts } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useSessionStore } from '@/shared/stores/session-store';

import { useUnreadCount } from '../hooks/use-notifications';

/** Bell for the Explore header with the unread badge; guests are asked to sign in on the screen. */
export function NotificationBell() {
  const theme = useTheme();
  const token = useSessionStore((state) => state.accessToken);
  const unread = useUnreadCount();
  const count = token ? unread.data ?? 0 : 0;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={count > 0 ? `Thông báo, ${count} chưa đọc` : 'Thông báo'}
      onPress={() => router.push('/notifications')}
      style={styles.button}
    >
      <SymbolView name={{ ios: 'bell', android: 'notifications', web: 'notifications' }} size={24} tintColor={theme.foreground} />
      {count > 0 ? (
        <View style={[styles.badge, { backgroundColor: theme.destructive }]}>
          <Text style={styles.badgeText}>{count > 99 ? '99+' : count}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  badge: { position: 'absolute', top: 2, right: 0, minWidth: 18, height: 18, borderRadius: 9, paddingHorizontal: 4, alignItems: 'center', justifyContent: 'center' },
  badgeText: { color: '#fff', fontFamily: Fonts.sansBold, fontSize: 10 },
});
