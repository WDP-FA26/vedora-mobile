import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Fonts, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { weekRange } from '../utils/meal-week';

export function MealWeekSelector({ weeks, selected, onChange, disabled }: {
  weeks: string[]; selected?: string; onChange: (week: string) => void; disabled?: boolean;
}) {
  const theme = useTheme();
  if (!weeks.length) return null;
  return (
    <View style={styles.group}>
      <Text style={[styles.title, { color: theme.foreground }]}>Tuần thực đơn</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {weeks.map((week, index) => (
          <Pressable key={week} accessibilityRole="tab" accessibilityState={{ selected: selected === week, disabled: !!disabled }}
            disabled={disabled} onPress={() => onChange(week)}
            style={[styles.option, { backgroundColor: selected === week ? theme.secondary : theme.card, borderColor: selected === week ? theme.primary : theme.border, opacity: disabled ? 0.5 : 1 }]}>
            <Text style={[styles.title, { color: theme.primary }]}>{index === 0 ? 'Tuần này' : index === 1 ? 'Tuần sau' : `Sau ${index} tuần`}</Text>
            <Text style={[styles.date, { color: theme.mutedForeground }]}>{weekRange(week)}</Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  group: { gap: Spacing.two },
  row: { gap: Spacing.two },
  option: { minHeight: 54, padding: Spacing.two, borderWidth: 1, borderRadius: Radius.xl, gap: Spacing.one },
  title: { fontFamily: Fonts.sansBold, fontSize: 14 },
  date: { fontFamily: Fonts.sans, fontSize: 12 },
});
