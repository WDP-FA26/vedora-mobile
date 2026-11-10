import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet, Text } from 'react-native';

import { Fonts, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useSessionStore } from '@/shared/stores/session-store';

/** "Nhắn tin" on another member's profile. Opening the chat creates nothing until a message is sent. */
export function MessageButton({ userId }: { userId: string }) {
  const theme = useTheme();
  const token = useSessionStore((state) => state.accessToken);

  function press() {
    if (!token) {
      router.push({ pathname: '/login', params: { returnTo: '/explore' } });
      return;
    }
    router.push({ pathname: '/messages/to/[userId]', params: { userId } });
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Nhắn tin"
      onPress={press}
      style={({ pressed }) => [styles.button, { borderColor: theme.border, opacity: pressed ? 0.7 : 1 }]}>
      <SymbolView name={{ ios: 'bubble.left', android: 'chat_bubble_outline', web: 'chat_bubble_outline' }} size={16} tintColor={theme.foreground} />
      <Text style={[styles.text, { color: theme.foreground }]}>Nhắn tin</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: { minHeight: 38, flexDirection: 'row', alignItems: 'center', gap: Spacing.one + Spacing.half, borderWidth: 1, borderRadius: Radius.xl, paddingHorizontal: Spacing.three },
  text: { fontFamily: Fonts.sansBold, fontSize: 13 },
});
