import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useState, type ReactNode } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Fonts, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { AssistantHeader } from '@/shared/components/chat/assistant-header';
import { useSessionStore } from '@/shared/stores/session-store';

import { useMealPlanner } from '../hooks/meal-planner-provider';
import type { Weekday } from '../types/meal-plan.schema';
import { avoidedIngredientsForRecipe, dayLabels, sectionLabels } from '../utils/meal-plan';
import { addCalendarDays, weekRange } from '../utils/meal-week';
import { MealWeekSelector } from './meal-week-selector';
import { MealRecipePhoto } from './meal-recipe-photo';
import { ActionButton, ActionText, MealActionSheet } from './meal-action-sheet';
import { MealEditSheet, type MealSelection } from './meal-edit-sheet';
import { QuickGenerateSheet } from './quick-generate-sheet';
import { ShoppingListPanel } from './shopping-list-panel';
import { MealPlanActions } from './meal-plan-actions';
import { MealRecipeActions } from './meal-recipe-actions';

const SHORT_DAY: Record<Weekday, string> = { MON: 'T2', TUE: 'T3', WED: 'T4', THU: 'T5', FRI: 'T6', SAT: 'T7', SUN: 'CN' };
const STICKER = require('@/assets/branding/tomato-sticker.png');

type ButtonProps = { label: string; onPress: () => void; disabled?: boolean; icon?: ReactNode };

function PrimaryButton({ label, onPress, disabled, icon }: ButtonProps) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.button, { backgroundColor: theme.primary, borderColor: theme.primary, opacity: disabled ? 0.55 : pressed ? 0.8 : 1 }]}>
      {icon}
      <Text style={[styles.buttonText, { color: theme.primaryForeground }]}>{label}</Text>
    </Pressable>
  );
}

function OutlineButton({ label, onPress, disabled, tone = 'primary' }: ButtonProps & { tone?: 'primary' | 'neutral' }) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.button, { backgroundColor: theme.card, borderColor: theme.border, opacity: disabled ? 0.55 : pressed ? 0.8 : 1 }]}>
      <Text style={[styles.buttonText, { color: tone === 'primary' ? theme.primary : theme.foreground }]}>{label}</Text>
    </Pressable>
  );
}

export function MealPlanScreen() {
  const theme = useTheme();
  const token = useSessionStore((s) => s.accessToken);
  const planner = useMealPlanner();
  const { plan, days, activeDay } = planner;
  const [selection, setSelection] = useState<MealSelection | null>(null);
  const [panel, setPanel] = useState<'shopping' | 'quick' | null>(null);

  if (!token) {
    return (
      <SafeAreaView edges={['top']} style={[styles.screen, { backgroundColor: theme.background }]}>
        <View style={styles.guest}>
          <Image source={STICKER} style={styles.guestSticker} resizeMode="contain" accessibilityLabel="Hình cà chua Vedora" />
          <View style={styles.guestCopy}>
            <Text style={[styles.guestTitle, { color: theme.foreground }]}>Thực đơn của tôi</Text>
            <Text style={[styles.guestText, { color: theme.mutedForeground }]}>Đăng nhập để nhờ trợ lý lên thực đơn 7 ngày và lưu tại đây.</Text>
          </View>
          <View style={styles.guestActions}>
            <PrimaryButton label="Đăng nhập" onPress={() => router.push({ pathname: '/login', params: { returnTo: '/meal-plan' } })} />
            <OutlineButton label="Tạo tài khoản" onPress={() => router.push({ pathname: '/register', params: { returnTo: '/meal-plan' } })} />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const mealCount = activeDay?.sections.reduce((total, { recipes }) => total + recipes.length, 0) ?? 0;
  const problems = plan.data?.problems ?? [];
  const nextWeek = planner.currentWeekStart ? addCalendarDays(planner.currentWeekStart, 7) : undefined;

  return (
    <SafeAreaView edges={['top']} style={[styles.screen, { backgroundColor: theme.background }]}>
      <AssistantHeader
        avatar={<Image source={STICKER} style={styles.headerSticker} resizeMode="contain" accessibilityLabel="Hình cà chua Vedora" />}
        title="Thực đơn của tôi"
        subtitle={planner.weekStart ? weekRange(planner.weekStart) : 'Thực đơn theo từng tuần'}
        action={<Pressable accessibilityRole="button" accessibilityLabel="Gọi trợ lý giọng nói" disabled={planner.busy || !plan.data} onPress={() => planner.setVoiceOpen(true)} style={{ padding: Spacing.three, opacity: planner.busy || !plan.data ? 0.4 : 1 }}><SymbolView name={{ ios: 'waveform', android: 'graphic_eq', web: 'graphic_eq' }} size={24} tintColor={theme.primary} /></Pressable>}
      />
      <MealPlanActions onShopping={() => setPanel('shopping')} onQuick={() => setPanel('quick')} shoppingDisabled={!plan.data || planner.busy} quickDisabled={!plan.data?.editable || planner.busy} readOnly={!!plan.data && !plan.data.editable} />
      <ScrollView style={styles.screen} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <MealWeekSelector weeks={planner.weeks} selected={planner.weekStart} currentWeekStart={plan.data?.currentWeekStart} onChange={planner.changeWeek} disabled={planner.busy} />
        {planner.mealActions.canUndo ? <ActionButton label="Hoàn tác thay đổi vừa lưu" disabled={planner.busy} onPress={() => void planner.mealActions.undo()} /> : null}
        {planner.mealActions.pending ? <ActivityIndicator accessibilityLabel="Đang lưu thực đơn" color={theme.primary} /> : null}
        {planner.mealActions.notice ? <ActionText>{planner.mealActions.notice}</ActionText> : null}
        {planner.mealActions.error ? <ActionText error>{planner.mealActions.error}</ActionText> : null}
        <Pressable accessibilityRole="button" onPress={() => router.push('/meal-log')} style={[styles.journal, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={[styles.journalIcon, { backgroundColor: theme.secondary }]}><SymbolView name={{ ios: 'book.closed', android: 'menu_book', web: 'menu_book' }} size={22} tintColor={theme.primary} /></View>
          <View style={styles.flex}>
            <Text style={[styles.recipeTitle, { color: theme.foreground }]}>Nhật ký ăn uống</Text>
            <Text style={[styles.helper, { color: theme.mutedForeground }]}>Ghi lại những món bạn đã ăn</Text>
          </View>
          <SymbolView name={{ ios: 'arrow.right', android: 'arrow_forward', web: 'arrow_forward' }} size={20} tintColor={theme.primary} />
        </Pressable>
        {planner.weekend && planner.weekStart === planner.currentWeekStart && nextWeek && planner.weeks.includes(nextWeek) ? (
          <View style={[styles.card, { borderColor: theme.border, backgroundColor: theme.secondary }]}>
            <Text style={[styles.cardTitle, { color: theme.foreground }]}>Chuẩn bị thực đơn cho tuần sau</Text>
            <Text style={[styles.helper, { color: theme.mutedForeground }]}>Cuối tuần rồi, bạn có thể lên trước thực đơn từ thứ Hai tới. Thực đơn tuần này được giữ riêng.</Text>
            <PrimaryButton label="Lên thực đơn tuần sau" disabled={planner.busy} onPress={() => { planner.changeWeek(nextWeek); planner.startForm(); }} />
          </View>
        ) : null}
        {plan.isPending && !plan.data ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator color={theme.primary} />
            <Text style={[styles.helper, { color: theme.mutedForeground }]}>Đang tải thực đơn…</Text>
          </View>
        ) : null}

        {plan.isError ? (
          <Pressable accessibilityRole="button" onPress={() => void plan.refetch()} style={[styles.notice, { borderColor: theme.destructive, backgroundColor: theme.card }]}>
            <Text style={[styles.noticeText, { color: theme.destructive }]}>Không tải được thực đơn đã lưu.</Text>
            <Text style={[styles.noticeAction, { color: theme.destructive }]}>Thử lại</Text>
          </Pressable>
        ) : null}

        {Boolean(plan.data?.problems.length) ? (
          <View style={[styles.notice, { borderColor: theme.destructive, backgroundColor: theme.card }]}>
            <Text style={[styles.noticeText, { color: theme.destructive }]}>
              Một số bữa cần xem lại: {plan.data?.problems.map((problem) => `${dayLabels[problem.day]}: ${problem.reason || problem.ingredients.join(', ') || problem.code}`).join('; ')}
            </Text>
          </View>
        ) : null}

        {plan.isPending && !plan.data ? null : days.length ? (
          <>
            <View accessibilityRole="tablist" style={styles.dayRow}>
              {days.map(({ day, sections }) => {
                const selected = activeDay?.day === day;
                const hasMeals = sections.some(({ recipes }) => recipes.length > 0);
                return (
                  <Pressable
                    key={day}
                    accessibilityRole="tab"
                    accessibilityLabel={dayLabels[day]}
                    accessibilityState={{ selected }}
                    onPress={() => planner.setSelectedDay(day)}
                    style={[styles.dayChip, { borderColor: selected ? theme.primary : theme.border, backgroundColor: selected ? theme.primary : theme.card }]}>
                    <Text style={[styles.dayText, { color: selected ? theme.primaryForeground : theme.foreground }]}>{SHORT_DAY[day]}</Text>
                    <View style={[styles.dayDot, { backgroundColor: hasMeals ? (selected ? theme.primaryForeground : theme.primary) : 'transparent' }]} />
                  </Pressable>
                );
              })}
            </View>

            {activeDay ? (
              <View style={styles.dayBody}>
                <View style={styles.dayHeading}>
                  <Text style={[styles.dayTitle, { color: theme.foreground }]}>{dayLabels[activeDay.day]} · {activeDay.date.split('-').reverse().join('/')}</Text>
                  <View style={[styles.badge, { backgroundColor: theme.muted }]}>
                    <Text style={[styles.badgeText, { color: theme.mutedForeground }]}>
                      {mealCount} món
                    </Text>
                  </View>
                </View>
                {!activeDay.editable ? <Text style={[styles.helper, { color: theme.mutedForeground }]}>Ngày đã qua · Chỉ xem lại</Text> : null}
                {activeDay.sections.map(({ section, recipes }) => (
                  <View key={section} style={styles.mealBlock}>
                    <View style={styles.mealHeading}>
                      <View style={[styles.mealIcon, { backgroundColor: theme.secondary }]}>
                        <SymbolView name={{ ios: section === 'BREAKFAST' ? 'sunrise' : section === 'LUNCH' ? 'sun.max' : section === 'DINNER' ? 'moon' : 'fork.knife', android: section === 'BREAKFAST' ? 'wb_twilight' : section === 'LUNCH' ? 'light_mode' : section === 'DINNER' ? 'dark_mode' : 'restaurant', web: section === 'BREAKFAST' ? 'wb_twilight' : section === 'LUNCH' ? 'light_mode' : section === 'DINNER' ? 'dark_mode' : 'restaurant' }} size={18} tintColor={theme.primary} />
                      </View>
                      <Text accessibilityRole="header" style={[styles.mealLabel, { color: theme.foreground }]}>Bữa {sectionLabels[section].toLowerCase()}</Text>
                      <Text style={[styles.helper, { color: theme.mutedForeground }]}>{recipes.length} món</Text>
                      {activeDay.editable ? <Pressable accessibilityRole="button" accessibilityLabel={`Thêm món bữa ${sectionLabels[section].toLowerCase()}`} accessibilityState={{ disabled: planner.busy || recipes.length >= 5 }} disabled={planner.busy || recipes.length >= 5} onPress={() => setSelection({ day: activeDay.day, section })} style={({ pressed }) => [styles.addMeal, { backgroundColor: theme.secondary, opacity: planner.busy || recipes.length >= 5 ? 0.45 : pressed ? 0.7 : 1 }]}><SymbolView name={{ ios: 'plus', android: 'add', web: 'add' }} size={20} tintColor={theme.primary} /></Pressable> : null}
                    </View>
                    {recipes.length ? (
                      recipes.map((recipe) => {
                        const avoided = avoidedIngredientsForRecipe(problems, activeDay.day, recipe);
                        return (
                          <View key={recipe.id} style={[styles.recipeCard, { borderColor: theme.border, backgroundColor: theme.card }]}>
                            <View style={styles.recipeTop}>
                              <MealRecipePhoto recipe={recipe} />
                              <Pressable
                              accessibilityRole="link"
                              accessibilityLabel={`Xem công thức ${recipe.title}${avoided.length ? `. Có nguyên liệu cần tránh: ${avoided.join(', ')}` : ''}`}
                              onPress={() => router.push({ pathname: '/recipes/[id]', params: { id: recipe.id } })}
                              style={({ pressed }) => [styles.recipeLink, { opacity: pressed ? 0.6 : 1 }]}>
                              <Text style={[styles.recipeTitle, { color: theme.foreground }]}>{recipe.title}</Text>
                              {avoided.length ? (
                                <View style={styles.recipeWarning}>
                                  <SymbolView name={{ ios: 'exclamationmark.triangle.fill', android: 'warning', web: 'warning' }} size={16} tintColor={theme.destructive} />
                                  <Text style={[styles.recipeWarningText, { color: theme.destructive }]}>Có nguyên liệu cần tránh: {avoided.join(', ')}</Text>
                                </View>
                              ) : null}
                              <Text style={[styles.recipeHint, { color: theme.primary }]}>Xem công thức ›</Text>
                              </Pressable>
                            </View>
                            {activeDay.editable ? <MealRecipeActions title={recipe.title} disabled={planner.busy} onMove={() => setSelection({ day: activeDay.day, section, recipe, action: 'move' })} onRemove={() => setSelection({ day: activeDay.day, section, recipe, action: 'remove' })} onReplace={() => planner.requestReplacement(activeDay.day, section, recipe.title)} /> : null}
                          </View>
                        );
                      })
                    ) : (
                      <Text style={[styles.emptyMeal, { color: theme.mutedForeground, borderColor: theme.border }]}>Chưa có món cho bữa này</Text>
                    )}
                  </View>
                ))}
              </View>
            ) : null}

          </>
        ) : (
          <View style={[styles.emptyPlan, { borderColor: theme.border, backgroundColor: theme.card }]}>
            <Image source={STICKER} style={styles.emptySticker} resizeMode="contain" accessibilityElementsHidden importantForAccessibility="no" />
            <View style={styles.emptyCopy}>
              <Text style={[styles.cardTitle, styles.center, { color: theme.foreground }]}>Chưa có thực đơn</Text>
              <Text style={[styles.helper, styles.center, { color: theme.mutedForeground }]}>Nhờ trợ lý lên thực đơn. Các món sẽ được lưu và cập nhật tại đây.</Text>
            </View>
            <View style={styles.emptyAction}>
              <PrimaryButton label="Nhờ trợ lý lên thực đơn" onPress={() => planner.startForm()} />
            </View>
          </View>
        )}
      </ScrollView>
      {days.length ? (
        <View style={[styles.cta, { backgroundColor: theme.card, borderTopColor: theme.border }]}>
          <View style={styles.ctaInner}>
            <Pressable
              accessibilityRole="button"
              onPress={() => planner.startForm()}
              style={({ pressed }) => [styles.ctaButton, { backgroundColor: theme.primary, opacity: pressed ? 0.85 : 1 }]}>
              <SymbolView name={{ ios: 'sparkles', android: 'auto_awesome', web: 'auto_awesome' }} size={18} tintColor={theme.primaryForeground} />
              <Text style={[styles.ctaText, { color: theme.primaryForeground }]}>Nhờ trợ lý lên thực đơn mới</Text>
            </Pressable>
          </View>
        </View>
      ) : null}
      {selection && planner.token ? <MealEditSheet planner={planner} selection={selection} onClose={() => setSelection(null)} /> : null}
      {panel === 'quick' && planner.token ? <QuickGenerateSheet planner={planner} onClose={() => setPanel(null)} /> : null}
      {panel === 'shopping' && planner.token && planner.weekStart ? <MealActionSheet title="Đi chợ 🧺" subtitle={weekRange(planner.weekStart)} onClose={() => setPanel(null)}><ShoppingListPanel weekStart={planner.weekStart} onRecipe={(id) => { setPanel(null); router.push({ pathname: '/recipes/[id]', params: { id } }); }} /></MealActionSheet> : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  flex: { flex: 1 },
  center: { textAlign: 'center' },
  headerSticker: { width: 38, height: 38 },
  content: { width: '100%', maxWidth: 680, alignSelf: 'center', padding: Spacing.three, paddingBottom: Spacing.five, gap: Spacing.three },
  journal: { minHeight: 76, borderWidth: 1, borderRadius: Radius['2xl'], padding: 12, flexDirection: 'row', alignItems: 'center', gap: 12 },
  journalIcon: { width: 44, height: 44, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  cta: { borderTopWidth: StyleSheet.hairlineWidth, paddingHorizontal: Spacing.three, paddingVertical: Spacing.two + Spacing.one },
  ctaInner: { width: '100%', maxWidth: 680, alignSelf: 'center' },
  ctaButton: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    borderRadius: Radius['2xl'],
    paddingHorizontal: Spacing.three,
    shadowColor: '#14261a',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  ctaText: { fontFamily: Fonts.sansBold, fontSize: 15, lineHeight: 21 },
  loadingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.two, paddingVertical: Spacing.three },
  helper: { fontFamily: Fonts.sans, fontSize: 13, lineHeight: 19 },
  error: { fontFamily: Fonts.sansMedium, fontSize: 13, lineHeight: 19 },

  button: { minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.two, borderWidth: 1, borderRadius: Radius.xl, paddingHorizontal: Spacing.three },
  buttonText: { fontFamily: Fonts.sansBold, fontSize: 14, lineHeight: 20, textAlign: 'center' },
  buttonRow: { flexDirection: 'row', gap: Spacing.two },

  notice: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.three, borderWidth: 1, borderRadius: Radius.xl, padding: Spacing.three },
  noticeText: { flex: 1, fontFamily: Fonts.sansMedium, fontSize: 13, lineHeight: 19 },
  noticeAction: { fontFamily: Fonts.sansBold, fontSize: 13, lineHeight: 19 },
  card: { borderWidth: 1, borderRadius: Radius['2xl'], padding: Spacing.three, gap: Spacing.three },
  cardCopy: { gap: Spacing.one },
  cardTitle: { fontFamily: Fonts.headingBold, fontSize: 16, lineHeight: 23 },

  dayRow: { flexDirection: 'row', gap: Spacing.one + Spacing.half },
  dayChip: { flex: 1, minHeight: 58, alignItems: 'center', justifyContent: 'center', gap: Spacing.one, borderWidth: 1, borderRadius: Radius['2xl'] },
  dayText: { fontFamily: Fonts.sansBold, fontSize: 14, lineHeight: 18 },
  dayDot: { width: 5, height: 5, borderRadius: 3 },

  dayBody: { gap: Spacing.three },
  dayHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.two },
  dayTitle: { flex: 1, fontFamily: Fonts.headingBold, fontSize: 20, lineHeight: 28 },
  badge: { borderRadius: Radius['4xl'], paddingHorizontal: Spacing.two + Spacing.one, paddingVertical: Spacing.one },
  badgeText: { fontFamily: Fonts.sansSemibold, fontSize: 12, lineHeight: 16 },
  mealBlock: { gap: Spacing.two },
  mealHeading: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, marginTop: Spacing.two },
  addMeal: { width: 44, height: 44, borderRadius: Radius.xl, alignItems: 'center', justifyContent: 'center' },
  mealIcon: { width: 32, height: 32, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  mealLabel: { flex: 1, fontFamily: Fonts.headingBold, fontSize: 16, lineHeight: 24 },
  recipeCard: { gap: 12, borderWidth: 1, borderRadius: Radius['3xl'], padding: 12 },
  recipeTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  recipeLink: { flex: 1, minWidth: 0, minHeight: 56, justifyContent: 'center', gap: 6 },
  recipeTitle: { fontFamily: Fonts.sansSemibold, fontSize: 15, lineHeight: 21 },
  recipeWarning: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.one },
  recipeWarningText: { flex: 1, fontFamily: Fonts.sansMedium, fontSize: 12, lineHeight: 17 },
  recipeHint: { fontFamily: Fonts.sansSemibold, fontSize: 12, lineHeight: 16 },
  emptyMeal: { borderWidth: 1, borderStyle: 'dashed', borderRadius: Radius.xl, paddingVertical: Spacing.three, paddingHorizontal: Spacing.three, textAlign: 'center', fontFamily: Fonts.sans, fontSize: 13, lineHeight: 19 },

  emptyPlan: { alignItems: 'center', gap: Spacing.three, borderWidth: 1, borderRadius: Radius['2xl'], padding: Spacing.four },
  emptySticker: { width: 88, height: 88 },
  emptyCopy: { gap: Spacing.one, alignSelf: 'stretch' },
  emptyAction: { alignSelf: 'stretch' },

  guest: { flex: 1, width: '100%', maxWidth: 420, alignSelf: 'center', alignItems: 'center', justifyContent: 'center', padding: Spacing.four, gap: Spacing.four },
  guestSticker: { width: 120, height: 120 },
  guestCopy: { alignSelf: 'stretch', alignItems: 'center', gap: Spacing.two },
  guestTitle: { fontFamily: Fonts.headingBold, fontSize: 22, lineHeight: 30, textAlign: 'center' },
  guestText: { fontFamily: Fonts.sans, fontSize: 14, lineHeight: 21, textAlign: 'center' },
  guestActions: { alignSelf: 'stretch', gap: Spacing.two },
});
