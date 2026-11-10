import { router } from 'expo-router';
import { Pressable, StyleSheet } from 'react-native';

import { useTheme } from '@/hooks/use-theme';
import { SproutPet } from '@/features/nutrition-chat/components/sprout-pet';

/** Floating "Trợ lý Vedora" entry, like the web mascot: quick nutrition Q&A from any tab. */
export function AssistantButton({ bottom }: { bottom: number }) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Mở Trợ lý Vedora"
      onPress={() => router.navigate('/ai')}
      style={({ pressed }) => [
        styles.button,
        { bottom, backgroundColor: theme.card, borderColor: theme.border, opacity: pressed ? 0.8 : 1 },
      ]}>
      <SproutPet size={34} accessible={false} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    position: 'absolute',
    right: 16,
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#14261a',
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
});
