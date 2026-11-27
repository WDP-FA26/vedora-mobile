import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SymbolView } from 'expo-symbols';

import { Fonts, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export function MealRecipeActions({ title, disabled, onMove, onRemove, onReplace }: {
  title: string; disabled?: boolean; onMove: () => void; onRemove: () => void; onReplace: () => void;
}) {
  const theme = useTheme();
  const { width, fontScale } = useWindowDimensions();
  const iconsOnly = width < 360 || fontScale > 1.2;
  const actions = [
    { label: 'Chuyển', hint: 'Chọn ngày và bữa muốn chuyển đến', icon: { ios: 'arrow.up.and.down.and.arrow.left.and.right', android: 'open_with', web: 'open_with' }, onPress: onMove, remove: false },
    { label: 'Gỡ', hint: 'Xác nhận trước khi gỡ khỏi bữa', icon: { ios: 'trash', android: 'delete_outline', web: 'delete_outline' }, onPress: onRemove, remove: true },
    { label: 'Đổi', hint: 'Nhờ trợ lý gợi ý món khác', icon: { ios: 'arrow.triangle.2.circlepath', android: 'sync', web: 'sync' }, onPress: onReplace, remove: false },
  ] as const;
  return <View style={[styles.row, { borderTopColor: theme.border }]}>
    {actions.map((action) => <Pressable key={action.label} accessibilityRole="button" accessibilityLabel={`${action.label} món ${title}`} accessibilityHint={action.hint} accessibilityState={{ disabled: !!disabled }} disabled={disabled} onPress={action.onPress} style={({ pressed }) => [styles.button, { borderColor: theme.border, backgroundColor: action.remove ? theme.card : theme.secondary, opacity: disabled ? 0.45 : pressed ? 0.7 : 1 }]}>
      <SymbolView name={action.icon} size={18} tintColor={action.remove ? theme.destructive : theme.primary} />
      {!iconsOnly ? <Text style={[styles.label, { color: action.remove ? theme.destructive : theme.primary }]}>{action.label}</Text> : null}
    </Pressable>)}
  </View>;
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: Spacing.two, borderTopWidth: StyleSheet.hairlineWidth, paddingTop: Spacing.two },
  button: { flex: 1, minWidth: 0, minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingHorizontal: 4, borderWidth: 1, borderRadius: Radius.lg },
  label: { fontFamily: Fonts.sansSemibold, fontSize: 13, lineHeight: 19 },
});
