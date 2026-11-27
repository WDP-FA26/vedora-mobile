import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Fonts, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { weekRange } from '../utils/meal-week';

export function MealWeekSelector({ weeks, selected, currentWeekStart, onChange, disabled }: {
  weeks: string[]; selected?: string; currentWeekStart?: string; onChange: (week: string) => void; disabled?: boolean;
}) {
  const theme = useTheme();
  if (!weeks.length) return null;
  const index = weeks.indexOf(selected ?? '');
  const previous = weeks[index - 1];
  const next = index < 0 ? undefined : weeks[index + 1];
  const label = currentWeekStart && selected ? selected < currentWeekStart ? 'Tuần cũ · Chỉ xem lại' : selected === currentWeekStart ? 'Tuần này' : 'Tuần sắp tới' : 'Tuần thực đơn';
  return (
    <View style={styles.group}>
      <View style={styles.row}>
        <Pressable accessibilityRole="button" accessibilityLabel="Tuần trước" disabled={disabled || !previous} onPress={() => previous && onChange(previous)} style={[styles.option, { borderColor: theme.border, opacity: disabled || !previous ? 0.35 : 1 }]}><Text style={{ color: theme.primary, fontSize: 24 }}>‹</Text></Pressable>
        <View style={{ flex: 1, gap: 4 }}><Text style={[styles.title, { color: theme.foreground }]}>{label}</Text><Text style={[styles.date, { color: theme.mutedForeground }]}>{selected ? weekRange(selected) : 'Đang tải…'}</Text></View>
        <Pressable accessibilityRole="button" accessibilityLabel="Tuần sau" disabled={disabled || !next} onPress={() => next && onChange(next)} style={[styles.option, { borderColor: theme.border, opacity: disabled || !next ? 0.35 : 1 }]}><Text style={{ color: theme.primary, fontSize: 24 }}>›</Text></Pressable>
      </View>
      {currentWeekStart && selected !== currentWeekStart ? <Pressable accessibilityRole="button" disabled={disabled} onPress={() => onChange(currentWeekStart)}><Text style={[styles.title, { color: theme.primary }]}>Về tuần này ↗</Text></Pressable> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  group: { gap: Spacing.two },
  row: { gap: Spacing.two, flexDirection: 'row', alignItems: 'center' },
  option: { minHeight: 48, minWidth: 44, alignItems: 'center', justifyContent: 'center', padding: Spacing.two, borderWidth: 1, borderRadius: Radius.xl },
  title: { fontFamily: Fonts.sansBold, fontSize: 14 },
  date: { fontFamily: Fonts.sans, fontSize: 12 },
});
