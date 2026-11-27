import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Fonts, Radius } from '@/constants/theme';
import { WeeklyCalorieChart } from '@/features/dietary-profile/components/weekly-calorie-chart';
import { useNutrition } from '@/features/dietary-profile/hooks/use-nutrition';
import { nutritionPillars } from '@/features/dietary-profile/types/nutrition-pillar.schema';
import { pillarLabels } from '@/features/dietary-profile/data/nutrition-labels';
import { useMealLog } from '@/features/meal-log/hooks/use-meal-log';
import { useTheme } from '@/hooks/use-theme';
import type { MealPlan } from '../types/meal-plan.schema';
import { computeWeekNutrition, buildBalancePrompt } from '../utils/meal-nutrition';
import { dayLabels, shortDayLabels } from '../utils/meal-plan';
import { weekRange } from '../utils/meal-week';
import { ActionButton, ActionText } from './meal-action-sheet';

export function MealNutritionSummary({ plan, token, onAskAssistant, busy, expanded = false }: { plan: MealPlan; token: string | null; onAskAssistant?: (prompt: string) => void; busy?: boolean; expanded?: boolean }) {
  const theme = useTheme();
  const [open, setOpen] = useState(expanded);
  const nutrition = useNutrition(token);
  const log = useMealLog(token, plan.weekStart);
  const summary = computeWeekNutrition(plan, nutrition.data);
  const coverage = summary.plannedDayCount ? 5 - summary.missingPillars.length : 0;
  return <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
    <Pressable accessibilityRole="button" accessibilityLabel="Tổng hợp dinh dưỡng tuần" accessibilityState={{ expanded: open }} onPress={() => setOpen(!open)} style={styles.heading}>
      <View style={styles.flex}><Text style={[styles.title, { color: theme.foreground }]}>Dinh dưỡng</Text><Text style={[styles.text, { color: theme.mutedForeground }]}>{summary.plannedDayCount ? `${coverage}/5 nhóm chất · ${summary.fullDayCount} ngày đủ 3 bữa` : 'Chưa có món trong tuần'} · {open ? 'Thu gọn' : 'Xem tổng hợp tuần'}</Text></View>
      <Image source={require('@/assets/branding/carrot-sticker.png')} resizeMode="contain" accessible={false} style={styles.sticker} />
      <SymbolView name={{ ios: open ? 'chevron.up' : 'chevron.down', android: open ? 'expand_less' : 'expand_more', web: open ? 'expand_less' : 'expand_more' }} size={20} tintColor={theme.primary} />
    </Pressable>
    {open ? <View style={styles.content}>
      <ActionText>{weekRange(plan.weekStart)} · Kcal ước tính cho 1 suất mỗi món, không nhân với số suất của cả công thức.</ActionText>
      {nutrition.isError ? <ActionButton label="Chưa tải được mục tiêu · Thử lại" onPress={() => void nutrition.refetch()} /> : nutrition.isPending ? <ActionText>Đang tải mục tiêu kcal…</ActionText> : null}
      <Text style={[styles.stat, { color: theme.primary }]}>{summary.hasKnownCalories ? `${summary.unknownCalories ? 'Ít nhất ' : '~'}${summary.totalCalories.toLocaleString('vi-VN')} kcal/tuần` : 'Chưa có kcal dự kiến'}</Text>
      <ActionText>{summary.averageFullDayCalories === null ? 'Trung bình sẽ hiện khi có ngày đủ 3 bữa chính và mọi món có kcal.' : `Trung bình ~${summary.averageFullDayCalories.toLocaleString('vi-VN')} kcal/ngày, tính trên ${summary.completeCalorieDays} ngày đủ 3 bữa và có đủ kcal.`}</ActionText>
      {summary.unknownCalories ? <ActionText>{summary.unknownCalories} món chưa có kcal; tổng tuần hiện chỉ gồm các món đã biết.</ActionText> : null}
      <WeeklyCalorieChart target={nutrition.data?.dailyCalorieTarget} days={summary.days.map((day) => {
        const logged = log.data?.days.find((item) => item.date === day.date);
        return { date: day.date, label: shortDayLabels[day.day], planned: day.hasKnownCalories ? day.calories : null, incomplete: day.unknownCalories > 0, logged: logged?.entries.length ? logged.loggedCalories : null, loggedIncomplete: (logged?.unknownCalorieEntries ?? 0) > 0 };
      })} />
      {log.isError ? <ActionButton label="Chưa tải được kcal đã ăn · Thử lại" onPress={() => void log.refetch()} /> : null}
      <Text style={[styles.title, { color: theme.foreground }]}>5 nhóm dưỡng chất chay</Text>
      {nutritionPillars.map((pillar) => <View key={pillar} style={styles.pillarRow}><Text style={[styles.text, styles.flex, { color: theme.foreground }]}>{pillarLabels[pillar].label}</Text><Text style={[styles.count, { color: summary.pillarCounts[pillar] ? theme.primary : theme.mutedForeground }]}>{summary.plannedDayCount ? `${summary.pillarCounts[pillar]}/${summary.plannedDayCount} ngày` : 'Chưa có món'}</Text></View>)}
      {summary.missingPillars.length ? <ActionText>Chưa xuất hiện: {summary.missingPillars.map((pillar) => pillarLabels[pillar].label).join(', ')}.</ActionText> : null}
      {summary.days.filter((day) => day.hints.length > 0).map((day) => <ActionText key={day.date}>{dayLabels[day.day]}: {day.hints.join(' ')}</ActionText>)}
      <ActionText>Nhóm chất dựa trên nhãn của món, chưa phản ánh lượng vi chất thực tế.</ActionText>
      {onAskAssistant ? <ActionButton label={plan.editable ? 'Nhờ AI cân đối tuần' : 'Nhờ AI nhận xét tuần cũ'} icon={<SymbolView name={{ ios: 'sparkles', android: 'auto_awesome', web: 'auto_awesome' }} size={18} tintColor={theme.primary} />} disabled={busy} onPress={() => onAskAssistant(buildBalancePrompt(plan, nutrition.data))} /> : null}
    </View> : null}
  </View>;
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: Radius['2xl'], padding: 16, gap: 14 },
  heading: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 44 }, flex: { flex: 1, minWidth: 0 },
  title: { fontFamily: Fonts.headingBold, fontSize: 16, lineHeight: 24 }, text: { fontFamily: Fonts.sans, fontSize: 13, lineHeight: 20 },
  sticker: { width: 32, height: 42, transform: [{ rotate: '10deg' }] }, content: { gap: 12 }, stat: { fontFamily: Fonts.headingBold, fontSize: 22, lineHeight: 30 },
  pillarRow: { flexDirection: 'row', alignItems: 'center', gap: 12 }, count: { fontFamily: Fonts.sansBold, fontSize: 13, lineHeight: 20 },
});
