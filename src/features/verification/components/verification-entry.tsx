import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { BrandColors, Fonts, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { useMyVerification } from '../hooks/use-verification';
import { verificationLabel } from '../utils/verification-state';

export function VerificationEntry() {
  const theme = useTheme();
  const query = useMyVerification();
  return (
    <Pressable accessibilityRole="button" onPress={() => router.push('/verification')} style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <SymbolView name={{ ios: 'checkmark.seal.fill', android: 'verified', web: 'verified' }} size={30} tintColor={query.data?.isProfessional ? BrandColors.verified : theme.mutedForeground} />
      <View style={styles.copy}>
        <Text style={[styles.title, { color: theme.foreground }]}>{query.data ? verificationLabel(query.data) : 'Xác minh chuyên gia'}</Text>
        <Text style={[styles.subtitle, { color: theme.mutedForeground }]}>{query.data?.isProfessional ? 'Xem kết quả xác minh của bạn' : 'Nộp minh chứng và theo dõi kết quả'}</Text>
      </View>
      <SymbolView name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }} size={20} tintColor={theme.mutedForeground} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { marginHorizontal: Spacing.three, padding: Spacing.three, borderWidth: 1, borderRadius: Radius['3xl'], flexDirection: 'row', alignItems: 'center', gap: Spacing.three, minHeight: 80 },
  copy: { flex: 1, gap: 4 },
  title: { fontFamily: Fonts.sansBold, fontSize: 16 },
  subtitle: { fontFamily: Fonts.sans, fontSize: 13 },
});
