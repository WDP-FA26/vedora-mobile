import { StyleSheet, Text, View } from 'react-native';
import { Fonts } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type CalorieDay = { date: string; label: string; planned: number | null; logged: number | null; incomplete?: boolean; loggedIncomplete?: boolean };

export function WeeklyCalorieChart({ days, target }: { days: CalorieDay[]; target?: number | null }) {
  const theme = useTheme();
  const maximum = Math.max(1, target ?? 0, ...days.flatMap((day) => [day.planned ?? 0, day.logged ?? 0]));
  return <View style={styles.content}>
    <Text style={[styles.caption, { color: theme.mutedForeground }]}>Dự kiến · Đã ăn (kcal){target ? ` · Mục tiêu ~${target.toLocaleString('vi-VN')}/ngày` : ''}</Text>
    {days.map((day) => <View key={day.date} accessible accessibilityLabel={`${day.label}, ${day.date}. Dự kiến ${day.planned === null ? 'chưa có kcal' : `${day.incomplete ? 'ít nhất ' : ''}${day.planned} kcal`}. Đã ăn ${day.logged === null ? 'chưa ghi' : `${day.loggedIncomplete ? 'ít nhất ' : ''}${day.logged} kcal`}.`} style={styles.row}>
      <Text style={[styles.day, { color: theme.foreground }]}>{day.label}</Text>
      <View style={styles.bars}>
        <View style={[styles.track, { backgroundColor: theme.muted }]}><View style={[styles.bar, { backgroundColor: theme.primary, opacity: 0.45, width: `${((day.planned ?? 0) / maximum) * 100}%` }]} /></View>
        <View style={[styles.track, { backgroundColor: theme.muted }]}><View style={[styles.bar, { backgroundColor: theme.primary, width: `${((day.logged ?? 0) / maximum) * 100}%` }]} /></View>
      </View>
      <Text style={[styles.values, { color: theme.mutedForeground }]}>{day.planned === null ? '—' : `${day.incomplete ? '≥' : '~'}${day.planned.toLocaleString('vi-VN')}`} / {day.logged === null ? '—' : `${day.loggedIncomplete ? '≥' : ''}${day.logged.toLocaleString('vi-VN')}`}</Text>
    </View>)}
  </View>;
}

const styles = StyleSheet.create({
  content: { gap: 12 }, caption: { fontFamily: Fonts.sans, fontSize: 12, lineHeight: 18 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 }, day: { fontFamily: Fonts.sansBold, fontSize: 12, minWidth: 24 },
  bars: { flex: 1, gap: 4 }, track: { height: 6, borderRadius: 4, overflow: 'hidden' }, bar: { height: 6, borderRadius: 4 },
  values: { fontFamily: Fonts.sans, fontSize: 11, width: 104, textAlign: 'right' },
});
