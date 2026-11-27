import { Image } from 'expo-image';
import { SymbolView } from 'expo-symbols';
import { RecipeNutrition } from '@/features/dietary-profile/components/recipe-nutrition';
import { useCallback, useEffect, useRef, type RefObject } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View, type ScrollViewInstance } from 'react-native';

import { Fonts, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { useMealPlan } from '../hooks/use-meal-plan';
import { weekdays } from '../types/meal-plan.schema';
import type { VoiceScreen } from '../types/voice.schema';
import { dayLabels, sectionLabels, shortDayLabels } from '../utils/meal-plan';
import { addCalendarDays, weekRange } from '../utils/meal-week';
import type { VoicePlanHighlight } from '../utils/voice-plan-highlight';

type Props = {
  screen: VoiceScreen; token: string | null; highlight?: VoicePlanHighlight | null;
  scrollRef: RefObject<ScrollViewInstance | null>;
  onDay: (day: NonNullable<VoiceScreen['day']>) => void; onRecipe: (id: string, title: string) => void;
};

export function VoiceCalendar({ screen, token, highlight, scrollRef, onDay, onRecipe }: Props) {
  const theme = useTheme();
  const plan = useMealPlan(token, screen.weekStart);
  const days = plan.data?.days.filter((day) => !screen.day || day.day === screen.day) ?? [];
  const targets = highlight?.weekStart === screen.weekStart ? highlight.targets : [];
  const target = targets.find((item) => !screen.day || item.day === screen.day);
  const rootY = useRef<number | undefined>(undefined);
  const dayY = useRef<Record<string, number>>({});
  const slotY = useRef<Record<string, number>>({});
  const lastScroll = useRef<number | undefined>(undefined);
  const go = useCallback(() => {
    if (!target || rootY.current === undefined) return;
    const day = dayY.current[target.day];
    const slot = slotY.current[`${target.day}:${target.section}`];
    if (day === undefined || slot === undefined) return;
    const y = rootY.current + day + slot;
    if (lastScroll.current === y) return;
    lastScroll.current = y;
    scrollRef.current?.scrollTo({ y, animated: true });
  }, [scrollRef, target]);
  useEffect(() => { lastScroll.current = undefined; go(); }, [go]);

  return <View style={styles.content} onLayout={(event) => { rootY.current = event.nativeEvent.layout.y; go(); }}>
    <View style={styles.section}>
      <Text accessibilityRole="header" style={[styles.title, { color: theme.foreground }]}>Thực đơn đang xem</Text>
      <Text style={[styles.caption, { color: theme.mutedForeground }]}>{weekRange(screen.weekStart)}</Text>
    </View>
    <View accessibilityRole="tablist" style={styles.dayTabs}>
      {weekdays.map((day, index) => {
        const date = addCalendarDays(screen.weekStart, index);
        const today = plan.data?.today === date;
        const changed = targets.some((item) => item.day === day);
        const selected = screen.day === day;
        return <Pressable key={day} accessibilityRole="tab" accessibilityLabel={dayLabels[day]}
          accessibilityHint={`${date.split('-').reverse().join('/')}${today ? ', hôm nay' : ''}${changed ? ', có bữa vừa cập nhật' : ''}`}
          accessibilityState={{ selected }} onPress={() => onDay(day)}
          style={[styles.dayTab, { backgroundColor: selected ? theme.secondary : theme.card, borderColor: selected || changed ? theme.primary : theme.border }]}>
          <Text style={[styles.dayLabel, { color: selected ? theme.primary : theme.mutedForeground }]}>{shortDayLabels[day]}</Text>
          <View style={[styles.dateCircle, { backgroundColor: today ? theme.primary : 'transparent' }]}>
            <Text style={[styles.dateNumber, { color: today ? theme.primaryForeground : theme.foreground }]}>{Number(date.slice(-2))}</Text>
          </View>
          <View style={[styles.dayDot, { backgroundColor: changed ? theme.primary : 'transparent' }]} />
        </Pressable>;
      })}
    </View>
    {targets.length ? <View style={[styles.changeNotice, { backgroundColor: theme.secondary }]}>
      <SymbolView name={{ ios: 'checkmark.circle', android: 'check_circle', web: 'check_circle' }} size={18} tintColor={theme.primary} />
      <Text accessibilityLiveRegion="polite" style={[styles.changeText, { color: theme.primary }]}>Vừa cập nhật: {targets.map((item) => `${shortDayLabels[item.day]} · ${sectionLabels[item.section]}`).join(', ')}</Text>
    </View> : null}
    {plan.isPending ? <View style={[styles.card, styles.loading, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <ActivityIndicator color={theme.primary} />
      <Text style={[styles.text, { color: theme.mutedForeground }]}>Đang mở thực đơn của bạn…</Text>
    </View> : null}
    {plan.isError ? <Pressable accessibilityRole="button" onPress={() => void plan.refetch()} style={[styles.card, { backgroundColor: theme.card, borderColor: theme.destructive }]}><Text style={[styles.text, { color: theme.destructive }]}>Chưa tải được thực đơn. Chạm để thử lại.</Text></Pressable> : null}
    {days.map((day) => <View key={day.day} onLayout={(event) => { dayY.current[day.day] = event.nativeEvent.layout.y; go(); }}
      style={[styles.card, { backgroundColor: theme.card, borderColor: targets.some((item) => item.day === day.day) ? theme.primary : theme.border }]}>
      <View style={styles.row}>
        <Text accessibilityRole="header" style={[styles.title, styles.flex, { color: theme.foreground }]}>{shortDayLabels[day.day]} · {day.date.split('-').reverse().join('/')}</Text>
        <Text style={[styles.caption, { color: theme.mutedForeground }]}>{day.sections.reduce((total, section) => total + section.recipes.length, 0)} món</Text>
      </View>
      {day.sections.map((section) => {
        const marked = targets.find((item) => item.day === day.day && item.section === section.section);
        return <View key={section.section} onLayout={(event) => { slotY.current[`${day.day}:${section.section}`] = event.nativeEvent.layout.y; go(); }}
          style={[styles.mealSlot, { backgroundColor: marked ? theme.secondary : theme.background, borderColor: marked ? theme.primary : theme.border }]}>
          <View style={styles.row}>
            <Text style={[styles.label, styles.flex, { color: marked ? theme.primary : theme.mutedForeground }]}>Bữa {sectionLabels[section.section].toLowerCase()}{marked ? ` · ${shortDayLabels[day.day]}, ${day.date.slice(5).split('-').reverse().join('/')}` : ''}</Text>
            {marked ? <Text style={[styles.changeBadge, { color: theme.primary }]}>Vừa sửa</Text> : null}
          </View>
          {section.recipes.map((recipe) => {
            const changed = !!marked?.recipeIds.includes(recipe.id);
            const color = changed ? theme.primaryForeground : theme.foreground;
            return <View key={recipe.id}><Pressable accessibilityRole="button" accessibilityLabel={`Xem công thức ${recipe.title}`}
              accessibilityHint={changed ? `Món vừa cập nhật, bữa ${sectionLabels[section.section].toLowerCase()} ${shortDayLabels[day.day]}` : undefined}
              accessibilityState={{ selected: changed }} onPress={() => onRecipe(recipe.id, recipe.title)}
              style={({ pressed }) => [styles.recipeRow, { backgroundColor: changed ? theme.primary : theme.card, opacity: pressed ? 0.7 : 1 }]}>
              <SymbolView name={changed ? { ios: 'checkmark.circle.fill', android: 'check_circle', web: 'check_circle' } : { ios: 'leaf', android: 'eco', web: 'eco' }} size={20} tintColor={changed ? color : theme.primary} />
              <Text style={[styles.recipeName, { color }]}>{recipe.title}</Text>
              <SymbolView name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }} size={18} tintColor={changed ? color : theme.primary} />
            </Pressable><View style={{ paddingHorizontal: 12, paddingBottom: 8 }}><RecipeNutrition {...recipe} /></View></View>;
          })}
          {!section.recipes.length ? <Text style={[styles.text, { color: theme.mutedForeground }]}>Chưa có món cho bữa này</Text> : null}
        </View>;
      })}
    </View>)}
    {plan.data && !days.length && !plan.isError ? <View style={[styles.card, styles.empty, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <Image source={require('@/assets/branding/tomato-sticker.png')} style={styles.emptySticker} contentFit="contain" accessible={false} />
      <Text style={[styles.title, { color: theme.foreground }]}>Bữa ngon đang chờ bạn</Text>
      <Text style={[styles.text, styles.center, { color: theme.mutedForeground }]}>Chưa có món cho ngày đang xem. Bạn có thể nhờ Vedora gợi ý món hoặc lên thực đơn.</Text>
    </View> : null}
  </View>;
}

const styles = StyleSheet.create({
  content: { gap: Spacing.three },
  section: { gap: Spacing.two },
  flex: { flex: 1 },
  center: { textAlign: 'center' },
  title: { fontFamily: Fonts.headingBold, fontSize: 18, lineHeight: 27 },
  text: { fontFamily: Fonts.sans, fontSize: 15, lineHeight: 24 },
  caption: { fontFamily: Fonts.sans, fontSize: 13, lineHeight: 20 },
  label: { fontFamily: Fonts.sansBold, fontSize: 14, lineHeight: 21 },
  dayTabs: { flexDirection: 'row', gap: 4 },
  dayTab: { flex: 1, minHeight: 78, alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: Spacing.two, borderWidth: 1, borderRadius: Radius.xl },
  dayLabel: { fontFamily: Fonts.sansSemibold, fontSize: 12, lineHeight: 18 },
  dateCircle: { minWidth: 28, minHeight: 28, borderRadius: 20, paddingHorizontal: 3, justifyContent: 'center', alignItems: 'center' },
  dateNumber: { fontFamily: Fonts.sansBold, fontSize: 14, lineHeight: 22 },
  dayDot: { width: 5, height: 5, borderRadius: 3 },
  changeNotice: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, padding: 12, borderRadius: Radius.xl },
  changeText: { flex: 1, fontFamily: Fonts.sansSemibold, fontSize: 13, lineHeight: 20 },
  changeBadge: { fontFamily: Fonts.sansBold, fontSize: 11, lineHeight: 18 },
  card: { borderWidth: 1, borderRadius: Radius['3xl'], padding: Spacing.three, gap: Spacing.three },
  loading: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  mealSlot: { borderWidth: 1, borderRadius: Radius['2xl'], padding: 12, gap: Spacing.two },
  recipeRow: { minHeight: 52, flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: Radius.xl, padding: 12 },
  recipeName: { flex: 1, fontFamily: Fonts.sansSemibold, fontSize: 15, lineHeight: 23 },
  empty: { alignItems: 'center', gap: 12, padding: Spacing.four },
  emptySticker: { width: 76, height: 84 },
});
