import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import type { ReactNode } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Fonts, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { AssistantHeader } from '@/shared/components/chat/assistant-header';
import { useSessionStore } from '@/shared/stores/session-store';

import { useMealPlanner } from '../hooks/meal-planner-provider';
import type { Weekday } from '../types/meal-plan.schema';
import { dayLabels, sectionLabels } from '../utils/meal-plan';

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

/** The Thực đơn tab: shows the saved week or the draft the assistant proposed; plans are made in the Trợ lý Vedora tab. */
export function MealPlanScreen() {
  const theme = useTheme();
  const token = useSessionStore((s) => s.accessToken);
  const planner = useMealPlanner();
  const { plan, draft, suggestion, days, activeDay, save } = planner;

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

  return (
    <SafeAreaView edges={['top']} style={[styles.screen, { backgroundColor: theme.background }]}>
      <AssistantHeader
        avatar={<Image source={STICKER} style={styles.headerSticker} resizeMode="contain" accessibilityLabel="Hình cà chua Vedora" />}
        title="Thực đơn của tôi"
        subtitle="Lặp lại theo từng thứ trong tuần"
      />
      <ScrollView style={styles.screen} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
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

        {suggestion && !draft ? (
          <View style={[styles.card, { borderColor: theme.border, backgroundColor: theme.secondary }]}>
            <View style={styles.cardCopy}>
              <Text style={[styles.cardTitle, { color: theme.foreground }]}>Trợ lý vừa đề xuất một thực đơn</Text>
              <Text style={[styles.helper, { color: theme.mutedForeground }]}>Thực đơn đã lưu vẫn giữ nguyên cho đến khi bạn lưu bản mới.</Text>
            </View>
            <PrimaryButton label="Xem đề xuất" onPress={() => planner.previewProposal(suggestion)} />
          </View>
        ) : null}

        {draft ? (
          <View style={[styles.card, { borderColor: theme.border, backgroundColor: theme.secondary }]}>
            <View style={styles.cardCopy}>
              <Text style={[styles.cardTitle, { color: theme.foreground }]}>Bản xem trước chưa lưu</Text>
              <Text style={[styles.helper, { color: theme.mutedForeground }]}>Xem qua từng ngày, đồng ý thì bấm Lưu để thay thực đơn hiện tại.</Text>
              {planner.saveError ? (
                <Text accessibilityRole="alert" style={[styles.error, { color: theme.destructive }]}>
                  {planner.saveError}
                </Text>
              ) : null}
            </View>
            <View style={styles.buttonRow}>
              <View style={styles.flex}>
                <PrimaryButton label={save.isPending ? 'Đang lưu…' : 'Lưu thực đơn'} disabled={save.isPending} onPress={() => void planner.saveDraft()} />
              </View>
              <View style={styles.flex}>
                <OutlineButton label="Bỏ đề xuất" tone="neutral" disabled={save.isPending} onPress={planner.discardDraft} />
              </View>
            </View>
          </View>
        ) : null}

        {Boolean(plan.data?.problems.length) && !draft ? (
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
                  <Text style={[styles.dayTitle, { color: theme.foreground }]}>{dayLabels[activeDay.day]}</Text>
                  <View style={[styles.badge, { backgroundColor: draft ? theme.secondary : theme.muted }]}>
                    <Text style={[styles.badgeText, { color: draft ? theme.secondaryForeground : theme.mutedForeground }]}>
                      {draft ? 'Bản xem trước' : `${mealCount} món`}
                    </Text>
                  </View>
                </View>
                {activeDay.sections.map(({ section, recipes }) => (
                  <View key={section} style={styles.mealBlock}>
                    <Text style={[styles.mealLabel, { color: theme.mutedForeground }]}>BỮA {sectionLabels[section].toUpperCase()}</Text>
                    {recipes.length ? (
                      recipes.map((recipe) => (
                        <View key={recipe.id} style={[styles.recipeCard, { borderColor: theme.border, backgroundColor: theme.card }]}>
                          <Text style={[styles.recipeTitle, { color: theme.foreground }]}>{recipe.title}</Text>
                          {!draft ? (
                            <Pressable
                              accessibilityRole="button"
                              accessibilityLabel={`Đổi món ${recipe.title}`}
                              hitSlop={6}
                              onPress={() => planner.requestReplacement(activeDay.day, section, recipe.title)}
                              style={({ pressed }) => [styles.swap, { backgroundColor: theme.secondary, opacity: pressed ? 0.7 : 1 }]}>
                              <SymbolView name={{ ios: 'arrow.triangle.2.circlepath', android: 'sync', web: 'sync' }} size={13} tintColor={theme.primary} />
                              <Text style={[styles.swapText, { color: theme.primary }]}>Đổi món</Text>
                            </Pressable>
                          ) : null}
                        </View>
                      ))
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
              <Text style={[styles.helper, styles.center, { color: theme.mutedForeground }]}>Nhờ trợ lý lên thực đơn, bản đề xuất sẽ hiện ở đây để bạn xem và lưu.</Text>
            </View>
            <View style={styles.emptyAction}>
              <PrimaryButton label="Nhờ trợ lý lên thực đơn" onPress={() => planner.startForm()} />
            </View>
          </View>
        )}
      </ScrollView>
      {!draft && days.length ? (
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  flex: { flex: 1 },
  center: { textAlign: 'center' },
  headerSticker: { width: 38, height: 38 },
  content: { width: '100%', maxWidth: 680, alignSelf: 'center', padding: Spacing.three, paddingBottom: Spacing.five, gap: Spacing.three },
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
  dayChip: { flex: 1, minHeight: 52, alignItems: 'center', justifyContent: 'center', gap: Spacing.one, borderWidth: 1, borderRadius: Radius.xl },
  dayText: { fontFamily: Fonts.sansBold, fontSize: 14, lineHeight: 18 },
  dayDot: { width: 5, height: 5, borderRadius: 3 },

  dayBody: { gap: Spacing.three },
  dayHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.two },
  dayTitle: { flex: 1, fontFamily: Fonts.headingBold, fontSize: 20, lineHeight: 28 },
  badge: { borderRadius: Radius['4xl'], paddingHorizontal: Spacing.two + Spacing.one, paddingVertical: Spacing.one },
  badgeText: { fontFamily: Fonts.sansSemibold, fontSize: 12, lineHeight: 16 },
  mealBlock: { gap: Spacing.two },
  mealLabel: { fontFamily: Fonts.sansBold, fontSize: 11, lineHeight: 16, letterSpacing: 1.1 },
  recipeCard: { minHeight: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.two + Spacing.one, borderWidth: 1, borderRadius: Radius.xl, paddingVertical: Spacing.two, paddingLeft: Spacing.three, paddingRight: Spacing.two },
  recipeTitle: { flex: 1, minWidth: 0, fontFamily: Fonts.sansSemibold, fontSize: 15, lineHeight: 21 },
  swap: { minHeight: 36, flexDirection: 'row', alignItems: 'center', gap: Spacing.one + Spacing.half, borderRadius: Radius['4xl'], paddingHorizontal: Spacing.two + Spacing.one },
  swapText: { fontFamily: Fonts.sansBold, fontSize: 12, lineHeight: 16 },
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
