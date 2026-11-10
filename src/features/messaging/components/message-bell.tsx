import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Fonts } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useSessionStore } from '@/shared/stores/session-store';

import { useMessagingUnread } from '../hooks/use-messaging';

/** Header icon that opens the inbox, with the total unread count; guests see the sign-in prompt there. */
export function MessageBell() {
  const theme = useTheme();
  const token = useSessionStore((state) => state.accessToken);
  const unread = useMessagingUnread();
  const count = token ? unread.data ?? 0 : 0;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={count > 0 ? `Tin nhắn, ${count} chưa đọc` : 'Tin nhắn'}
      onPress={() => router.push('/messages')}
      style={styles.button}>
      <SymbolView name={{ ios: 'bubble.left.and.bubble.right', android: 'chat', web: 'chat' }} size={23} tintColor={theme.foreground} />
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
