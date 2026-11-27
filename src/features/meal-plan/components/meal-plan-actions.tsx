import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SymbolView } from 'expo-symbols';

import { Fonts, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export function MealPlanActions({ onShopping, onQuick, shoppingDisabled, quickDisabled, readOnly }: {
  onShopping: () => void; onQuick: () => void; shoppingDisabled?: boolean; quickDisabled?: boolean; readOnly?: boolean;
}) {
  const theme = useTheme();
  return <View style={styles.row}>
    <Pressable accessibilityRole="button" accessibilityLabel="Đi chợ" accessibilityHint="Mở danh sách nguyên liệu từ thực đơn" accessibilityState={{ disabled: !!shoppingDisabled }} disabled={shoppingDisabled} onPress={onShopping} style={({ pressed }) => [styles.action, { backgroundColor: theme.primary, borderColor: theme.primary, opacity: shoppingDisabled ? 0.6 : pressed ? 0.85 : 1 }]}>
      <SymbolView name={{ ios: 'basket.fill', android: 'shopping_basket', web: 'shopping_basket' }} size={19} tintColor={theme.primaryForeground} />
      <Text style={[styles.title, { color: theme.primaryForeground }]}>Đi chợ</Text>
    </Pressable>
    <Pressable accessibilityRole="button" accessibilityLabel="Lên nhanh" accessibilityHint={readOnly ? 'Tuần cũ chỉ có thể xem lại' : 'Tự động chọn và lưu món theo hồ sơ ăn uống'} accessibilityState={{ disabled: !!quickDisabled }} disabled={quickDisabled} onPress={onQuick} style={({ pressed }) => [styles.action, { backgroundColor: theme.secondary, borderColor: theme.primary + '40', opacity: quickDisabled ? 0.6 : pressed ? 0.8 : 1 }]}>
      <SymbolView name={{ ios: 'sparkles', android: 'auto_awesome', web: 'auto_awesome' }} size={19} tintColor={theme.primary} />
      <Text style={[styles.title, { color: theme.foreground }]}>Lên nhanh</Text>
    </Pressable>
  </View>;
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: Spacing.two, paddingHorizontal: Spacing.four, paddingTop: Spacing.two, paddingBottom: Spacing.three },
  action: { flex: 1, minWidth: 0, minHeight: 46, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderRadius: Radius.xl, paddingHorizontal: Spacing.three, paddingVertical: Spacing.two, gap: 8 },
  title: { flexShrink: 1, fontFamily: Fonts.sansBold, fontSize: 15, lineHeight: 22 },
});
