import { SymbolView } from 'expo-symbols';
import { StyleSheet, Text, View, type StyleProp, type TextStyle } from 'react-native';

import { BrandColors } from '@/constants/theme';

export function ProfessionalBadge({ isProfessional, size = 16 }: { isProfessional?: boolean; size?: number }) {
  if (isProfessional !== true) return null;
  return <SymbolView accessibilityLabel="Chuyên gia đã xác minh" name={{ ios: 'checkmark.seal.fill', android: 'verified', web: 'verified' }} size={size} tintColor={BrandColors.verified} style={styles.badge} />;
}

export function ProfessionalName({ name, isProfessional, textStyle, badgeSize = 16, numberOfLines = 1 }: {
  name: string; isProfessional?: boolean; textStyle?: StyleProp<TextStyle>; badgeSize?: number; numberOfLines?: number;
}) {
  return (
    <View style={styles.row} accessible accessibilityLabel={`${name}${isProfessional === true ? ', Chuyên gia đã xác minh' : ''}`}>
      <Text numberOfLines={numberOfLines} style={[textStyle, styles.text]}>{name}</Text>
      <ProfessionalBadge isProfessional={isProfessional} size={badgeSize} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 4, flexShrink: 1, minWidth: 0, maxWidth: '100%' },
  text: { flexShrink: 1, minWidth: 0 },
  badge: { flexShrink: 0 },
});
