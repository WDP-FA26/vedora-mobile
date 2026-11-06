import { Image } from 'expo-image';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { Fonts } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import type { Profile } from '../types/profile.schema';

/** Round avatar with a card-coloured ring; falls back to the first letter of the name. */
export function ProfileAvatar({ profile, size, style }: { profile: Pick<Profile, 'fullName' | 'avatarUrl'>; size: number; style?: StyleProp<ViewStyle> }) {
  const theme = useTheme();
  const frame = { width: size, height: size, borderRadius: size / 2, backgroundColor: theme.secondary, borderColor: theme.card };
  if (profile.avatarUrl) {
    return (
      <View style={[styles.ring, frame, style]}>
        <Image source={{ uri: profile.avatarUrl }} style={StyleSheet.absoluteFill} contentFit="cover" accessibilityLabel={`Ảnh đại diện của ${profile.fullName}`} />
      </View>
    );
  }
  return (
    <View style={[styles.ring, styles.empty, frame, style]}>
      <Text style={[styles.letter, { color: theme.primary, fontSize: size * 0.36 }]}>{profile.fullName.trim().charAt(0).toLocaleUpperCase('vi') || 'V'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  ring: { borderWidth: 4, overflow: 'hidden' },
  empty: { alignItems: 'center', justifyContent: 'center' },
  letter: { fontFamily: Fonts.headingExtraBold },
});
