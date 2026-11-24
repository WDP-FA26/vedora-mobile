import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Fonts, Radius, Spacing } from '@/constants/theme';
import { useMealPlan } from '@/features/meal-plan/hooks/use-meal-plan';
import { mealSections, type Weekday } from '@/features/meal-plan/types/meal-plan.schema';
import { dayLabels, sectionLabels } from '@/features/meal-plan/utils/meal-plan';
import { addCalendarDays, weekRange } from '@/features/meal-plan/utils/meal-week';
import { useTheme } from '@/hooks/use-theme';
import { useSessionStore } from '@/shared/stores/session-store';

import { useDeleteMealLogEntry, useMealLog } from '../hooks/use-meal-log';
import type { MealLogDay } from '../types/meal-log.schema';
import { caloriesLabel, mealLogErrorMessage, vn } from '../utils/meal-log';
import { MealLogEntryForm, type PlannedRecipe } from './meal-log-entry-form';

const SHORT_DAY: Record<Weekday, string> = { MON: 'T2', TUE: 'T3', WED: 'T4', THU: 'T5', FRI: 'T6', SAT: 'T7', SUN: 'CN' };

function DayTotal({ day, target }: { day: MealLogDay; target: number | null }) {
  const theme = useTheme();
  const logged = `${day.unknownCalorieEntries ? 'Ít nhất ' : ''}${vn(day.loggedCalories)} kcal`;
  const remaining = target === null ? null : target - day.loggedCalories;
  return <View style={[styles.card, { backgroundColor: theme.secondary, borderColor: theme.secondary }]}>
    <Text style={[styles.total, { color: theme.primary }]}>{logged}</Text>
    <Text style={[styles.helper, { color: theme.secondaryForeground }]}>
      {target === null ? 'Khai báo chiều cao và cân nặng trong Hồ sơ ăn uống để có mục tiêu mỗi ngày.' : remaining !== null && remaining > 0 ? `Còn lại ${vn(remaining)} kcal trong mục tiêu ~${vn(target)} kcal` : `Mục tiêu hôm nay ~${vn(target)} kcal`}
    </Text>
    {target ? <View style={[styles.track, { backgroundColor: theme.card }]}><View style={[styles.fill, { width: `${Math.min(100, Math.round((day.loggedCalories / target) * 100))}%`, backgroundColor: theme.primary }]} /></View> : null}
    {day.plannedCalories !== null ? <Text style={[styles.helper, { color: theme.secondaryForeground }]}>Thực đơn dự kiến: {vn(day.plannedCalories)} kcal</Text> : null}
    {day.unknownCalorieEntries ? <Text style={[styles.helper, { color: theme.secondaryForeground }]}>{day.unknownCalorieEntries} món chưa có kcal nên tổng thực tế có thể cao hơn.</Text> : null}
  </View>;
}

/** What you actually ate each day of a week, with kcal against the daily target. */
export function MealLogScreen() {
  const theme = useTheme();
  const token = useSessionStore((state) => state.accessToken);
  const hydrated = useSessionStore((state) => state.isHydrated);
  const [weekStart, setWeekStart] = useState<string | undefined>();
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState('');
  const log = useMealLog(token, weekStart);
  const plan = useMealPlan(token, log.data?.weekStart);
  const remove = useDeleteMealLogEntry(token);
  const week = log.data;
  const day = week ? week.days.find((item) => item.date === selectedDate) ?? week.days.find((item) => item.date === week.today) ?? week.days[0] : undefined;
  const isCurrentWeek = !!week?.days.some((item) => item.date === week.today);
  const planned: PlannedRecipe[] = plan.data?.days.find((item) => item.date === day?.date)?.sections.flatMap(({ section, recipes }) => recipes.map(({ id, title }) => ({ section, id, title }))) ?? [];

  function move(offset: number) {
    if (!week) return;
    setWeekStart(addCalendarDays(week.weekStart, offset));
    setSelectedDate(null);
    setError('');
  }

  function confirmDelete(id: string, name: string) {
    Alert.alert('Xóa món khỏi nhật ký?', name, [
      { text: 'Giữ lại', style: 'cancel' },
      { text: 'Xóa', style: 'destructive', onPress: () => { setError(''); remove.mutate(id, { onError: (caught) => setError(mealLogErrorMessage(caught)) }); } },
    ]);
  }

  if (!hydrated) return <SafeAreaView edges={['top']} style={[styles.screen, styles.center, { backgroundColor: theme.background }]}><ActivityIndicator color={theme.primary} /></SafeAreaView>;
  if (!token) return <SafeAreaView edges={['top']} style={[styles.screen, styles.center, { backgroundColor: theme.background }]}>
    <Text style={[styles.title, { color: theme.foreground }]}>Nhật ký ăn uống</Text>
    <Text style={[styles.helper, styles.centerText, { color: theme.mutedForeground }]}>Đăng nhập để ghi lại món bạn đã ăn và theo dõi kcal mỗi ngày.</Text>
    <Pressable accessibilityRole="button" onPress={() => router.push({ pathname: '/login', params: { returnTo: '/meal-log' } })} style={[styles.primary, { backgroundColor: theme.primary }]}><Text style={[styles.buttonText, { color: theme.primaryForeground }]}>Đăng nhập</Text></Pressable>
  </SafeAreaView>;

  return <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={[styles.screen, { backgroundColor: theme.background }]}>
    <View style={[styles.header, { borderBottomColor: theme.border }]}>
      <Pressable accessibilityRole="button" accessibilityLabel="Quay lại" onPress={() => router.back()} style={[styles.back, { backgroundColor: theme.muted }]}><SymbolView name={{ ios: 'arrow.left', android: 'arrow_back', web: 'arrow_back' }} size={20} tintColor={theme.foreground} /></Pressable>
      <View style={styles.flex}><Text style={[styles.title, { color: theme.foreground }]}>Nhật ký ăn uống</Text><Text style={[styles.helper, { color: theme.mutedForeground }]}>{week ? weekRange(week.weekStart) : 'Món bạn đã thực sự ăn'}</Text></View>
      <Pressable accessibilityRole="button" accessibilityLabel="Tuần trước" disabled={!week} onPress={() => move(-7)} style={[styles.back, { backgroundColor: theme.muted, opacity: week ? 1 : 0.5 }]}><SymbolView name={{ ios: 'chevron.left', android: 'chevron_left', web: 'chevron_left' }} size={18} tintColor={theme.foreground} /></Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel="Tuần sau" disabled={!week || isCurrentWeek} onPress={() => move(7)} style={[styles.back, { backgroundColor: theme.muted, opacity: !week || isCurrentWeek ? 0.4 : 1 }]}><SymbolView name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }} size={18} tintColor={theme.foreground} /></Pressable>
    </View>
    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={log.isRefetching} onRefresh={() => void log.refetch()} />}>
      {log.isPending ? <View style={styles.row}><ActivityIndicator color={theme.primary} /><Text style={[styles.helper, { color: theme.mutedForeground }]}>Đang tải nhật ký…</Text></View> : null}
      {log.isError ? <Pressable accessibilityRole="button" onPress={() => void log.refetch()} style={[styles.card, { borderColor: theme.destructive, backgroundColor: theme.card }]}><Text style={[styles.helper, { color: theme.destructive }]}>Không tải được nhật ký. Chạm để thử lại.</Text></Pressable> : null}
      {week && day ? <>
        <View accessibilityRole="tablist" style={styles.row}>{week.days.map((item) => {
          const selected = item.date === day.date;
          return <Pressable key={item.date} accessibilityRole="tab" accessibilityLabel={dayLabels[item.day]} accessibilityState={{ selected }} onPress={() => { setSelectedDate(item.date); setError(''); }} style={[styles.dayChip, { borderColor: selected ? theme.primary : theme.border, backgroundColor: selected ? theme.primary : theme.card }]}>
            <Text style={[styles.dayText, { color: selected ? theme.primaryForeground : theme.foreground }]}>{SHORT_DAY[item.day]}</Text>
            <View style={[styles.dot, { backgroundColor: item.entries.length ? (selected ? theme.primaryForeground : theme.primary) : 'transparent' }]} />
          </Pressable>;
        })}</View>
        <Text style={[styles.heading, { color: theme.foreground }]}>{dayLabels[day.day]} · {day.date.split('-').reverse().join('/')}</Text>
        <DayTotal day={day} target={week.dailyCalorieTarget} />
        {!day.loggable ? <Text style={[styles.helper, { color: theme.mutedForeground }]}>Ngày này đã khóa · Chỉ xem lại</Text> : null}
        {error ? <Text accessibilityRole="alert" style={[styles.helper, { color: theme.destructive }]}>{error}</Text> : null}
        {mealSections.map((section) => {
          const entries = day.entries.filter((entry) => entry.section === section);
          if (!entries.length) return null;
          return <View key={section} style={styles.block}>
            <Text style={[styles.sectionLabel, { color: theme.mutedForeground }]}>BỮA {sectionLabels[section].toUpperCase()}</Text>
            {entries.map((entry) => <View key={entry.id} style={[styles.entry, { borderColor: theme.border, backgroundColor: theme.card }]}>
              <View style={styles.flex}>
                <Text style={[styles.entryName, { color: theme.foreground }]}>{entry.name}</Text>
                <Text style={[styles.helper, { color: theme.mutedForeground }]}>{vn(entry.servings)} khẩu phần · {caloriesLabel(entry)}{entry.calorieSource === 'WEB_ESTIMATE' ? ' · AI ước tính' : ''}</Text>
              </View>
              {day.loggable ? <Pressable accessibilityRole="button" accessibilityLabel={`Xóa ${entry.name}`} disabled={remove.isPending} hitSlop={6} onPress={() => confirmDelete(entry.id, entry.name)} style={[styles.back, { backgroundColor: theme.muted }]}><SymbolView name={{ ios: 'trash', android: 'delete', web: 'delete' }} size={18} tintColor={theme.destructive} /></Pressable> : null}
            </View>)}
          </View>;
        })}
        {!day.entries.length ? <Text style={[styles.empty, { color: theme.mutedForeground, borderColor: theme.border }]}>{day.loggable ? 'Chưa ghi món nào cho ngày này.' : 'Ngày này không có món nào được ghi.'}</Text> : null}
        {day.loggable ? <Pressable accessibilityRole="button" onPress={() => setAdding(true)} style={[styles.primary, { backgroundColor: theme.primary }]}><Text style={[styles.buttonText, { color: theme.primaryForeground }]}>Ghi món đã ăn</Text></Pressable> : null}

        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.heading, { color: theme.foreground }]}>Tổng kết tuần</Text>
          <Text style={[styles.helper, { color: theme.mutedForeground }]}>Đã ghi {week.summary.loggedDays} ngày{week.summary.averageCalories !== null ? ` · Trung bình ~${vn(week.summary.averageCalories)} kcal/ngày (tính ${week.summary.completeDays} ngày đã qua có đủ kcal)` : '. Trung bình sẽ hiện khi có ngày đã qua với mọi món đều có kcal.'}</Text>
        </View>
      </> : null}
    </ScrollView>
    {adding && week && day ? <MealLogEntryForm token={token} day={day} planned={planned} onClose={() => setAdding(false)} /> : null}
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  flex: { flex: 1, minWidth: 0 },
  center: { justifyContent: 'center', alignItems: 'center', padding: Spacing.four, gap: Spacing.three },
  centerText: { textAlign: 'center' },
  header: { minHeight: 80, borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.three, gap: 8 },
  back: { width: 44, height: 44, borderRadius: Radius.xl, alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: Fonts.headingBold, fontSize: 18, lineHeight: 27 },
  helper: { fontFamily: Fonts.sans, fontSize: 13, lineHeight: 20 },
  content: { width: '100%', maxWidth: 680, alignSelf: 'center', padding: Spacing.three, paddingBottom: Spacing.five, gap: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dayChip: { flex: 1, minHeight: 52, alignItems: 'center', justifyContent: 'center', gap: 4, borderWidth: 1, borderRadius: Radius.xl },
  dayText: { fontFamily: Fonts.sansBold, fontSize: 14, lineHeight: 18 },
  dot: { width: 5, height: 5, borderRadius: 3 },
  heading: { fontFamily: Fonts.headingBold, fontSize: 18, lineHeight: 26 },
  card: { borderWidth: 1, borderRadius: Radius['2xl'], padding: Spacing.three, gap: 6 },
  total: { fontFamily: Fonts.headingBold, fontSize: 26, lineHeight: 34 },
  track: { height: 8, borderRadius: 4, overflow: 'hidden' },
  fill: { height: 8, borderRadius: 4 },
  block: { gap: 8 },
  sectionLabel: { fontFamily: Fonts.sansBold, fontSize: 11, lineHeight: 16, letterSpacing: 1.1 },
  entry: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderRadius: Radius.xl, padding: Spacing.two },
  entryName: { fontFamily: Fonts.sansSemibold, fontSize: 15, lineHeight: 21 },
  empty: { borderWidth: 1, borderStyle: 'dashed', borderRadius: Radius.xl, padding: Spacing.three, textAlign: 'center', fontFamily: Fonts.sans, fontSize: 13, lineHeight: 19 },
  primary: { minHeight: 50, borderRadius: Radius['2xl'], alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 },
  buttonText: { fontFamily: Fonts.sansBold, fontSize: 15, lineHeight: 22 },
});
