import { router } from 'expo-router';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Fonts, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useSessionStore } from '@/shared/stores/session-store';

import { useMealPlanner } from '../hooks/meal-planner-provider';
import { dayLabels, sectionLabels } from '../utils/meal-plan';

/** The Thực đơn tab: shows the saved week or the draft the assistant proposed; plans are made in the Trợ lý Vedora tab. */
export function MealPlanScreen() {
  const theme = useTheme();
  const token = useSessionStore((s) => s.accessToken);
  const planner = useMealPlanner();
  const { plan, draft, suggestion, days, activeDay, save } = planner;

  if (!token) return <SafeAreaView edges={['top']} style={[styles.screen, { backgroundColor: theme.background }]}><View style={styles.guest}>
    <Image source={require('@/assets/branding/tomato-sticker.png')} style={styles.guestSticker} resizeMode="contain" accessibilityLabel="Hình cà chua Vedora" />
    <Text style={[styles.title, { color: theme.foreground }]}>Thực đơn của bạn</Text>
    <Text style={[styles.guestText, { color: theme.mutedForeground }]}>Đăng nhập để nhờ Trợ lý Vedora lên thực đơn 7 ngày và lưu lại tại đây.</Text>
    <Pressable accessibilityRole="button" onPress={() => router.push({ pathname: '/login', params: { returnTo: '/meal-plan' } })} style={[styles.primaryButton, { backgroundColor: theme.primary }]}><Text style={[styles.primaryText, { color: theme.primaryForeground }]}>Đăng nhập</Text></Pressable>
    <Pressable accessibilityRole="button" onPress={() => router.push({ pathname: '/register', params: { returnTo: '/meal-plan' } })} style={[styles.outlineButton, { borderColor: theme.border }]}><Text style={[styles.outlineText, { color: theme.primary }]}>Tạo tài khoản</Text></Pressable>
  </View></SafeAreaView>;

  return <SafeAreaView edges={['top']} style={[styles.screen, { backgroundColor: theme.background }]}>
    <View style={[styles.header, { backgroundColor: theme.background, borderBottomColor: theme.border }]}>
      <View style={styles.headerText}><Text style={[styles.title, { color: theme.foreground }]}>Lên thực đơn</Text><Text style={[styles.subtitle, { color: theme.mutedForeground }]}>Thực đơn tuần lặp lại theo thứ trong tuần</Text></View>
      <Image source={require('@/assets/branding/tomato-sticker.png')} style={styles.sticker} resizeMode="contain" accessibilityLabel="Hình cà chua Vedora" />
    </View>
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      {plan.isPending && !plan.data ? <View style={styles.loadingRow}><ActivityIndicator color={theme.primary} /><Text style={[styles.helper, { color: theme.mutedForeground }]}>Đang tải thực đơn…</Text></View> : null}
      {plan.isError ? <Pressable accessibilityRole="button" onPress={() => void plan.refetch()} style={[styles.notice, { borderColor: theme.destructive }]}><Text style={[styles.error, { color: theme.destructive }]}>Không tải được thực đơn đã lưu. Chạm để thử lại.</Text></Pressable> : null}
      {suggestion && !draft ? <View style={[styles.suggestion, { borderColor: theme.border, backgroundColor: theme.secondary }]}><Text style={[styles.sectionTitle, { color: theme.foreground }]}>Đề xuất mới từ trợ lý</Text><Text style={[styles.helper, { color: theme.mutedForeground }]}>Thực đơn đã lưu chưa thay đổi. Xem trước khi quyết định.</Text><Pressable accessibilityRole="button" onPress={() => planner.previewProposal(suggestion)} style={[styles.smallPrimary, { backgroundColor: theme.primary }]}><Text style={[styles.smallPrimaryText, { color: theme.primaryForeground }]}>Xem đề xuất</Text></Pressable></View> : null}
      {draft ? <View style={[styles.suggestion, { borderColor: theme.border, backgroundColor: theme.secondary }]}>
        <Text style={[styles.sectionTitle, { color: theme.foreground }]}>Đề xuất chưa được lưu</Text>
        <Text style={[styles.helper, { color: theme.mutedForeground }]}>Kiểm tra từng ngày rồi xác nhận cập nhật thực đơn.</Text>
        {planner.saveError ? <Text accessibilityRole="alert" style={[styles.error, { color: theme.destructive }]}>{planner.saveError}</Text> : null}
        <View style={styles.actions}>
          <Pressable accessibilityRole="button" accessibilityState={{ disabled: save.isPending }} disabled={save.isPending} onPress={() => void planner.saveDraft()} style={[styles.smallPrimary, { backgroundColor: theme.primary }]}><Text style={[styles.smallPrimaryText, { color: theme.primaryForeground }]}>{save.isPending ? 'Đang lưu…' : 'Lưu thực đơn'}</Text></Pressable>
          <Pressable accessibilityRole="button" accessibilityState={{ disabled: save.isPending }} disabled={save.isPending} onPress={planner.discardDraft} style={[styles.outlineButton, { borderColor: theme.border }]}><Text style={[styles.outlineText, { color: theme.foreground }]}>Bỏ đề xuất</Text></Pressable>
        </View>
      </View> : null}
      {Boolean(plan.data?.problems.length) && !draft ? <View style={[styles.notice, { borderColor: theme.destructive }]}><Text style={[styles.error, { color: theme.destructive }]}>Một số bữa cần xem lại: {plan.data?.problems.map((problem) => `${dayLabels[problem.day]}: ${problem.reason || problem.ingredients.join(', ') || problem.code}`).join('; ')}</Text></View> : null}
      {plan.isPending && !plan.data ? null : days.length ? <>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dayList}>{days.map(({ day }) => <Pressable key={day} accessibilityRole="button" accessibilityState={{ selected: activeDay?.day === day }} onPress={() => planner.setSelectedDay(day)} style={[styles.dayChip, { borderColor: activeDay?.day === day ? theme.primary : theme.border, backgroundColor: activeDay?.day === day ? theme.primary : theme.card }]}><Text style={[styles.dayText, { color: activeDay?.day === day ? theme.primaryForeground : theme.foreground }]}>{dayLabels[day]}</Text></Pressable>)}</ScrollView>
        {activeDay ? <View style={styles.dayBody}><Text style={[styles.dayTitle, { color: theme.foreground }]}>{dayLabels[activeDay.day]}{draft ? ' · bản xem trước' : ''}</Text>{activeDay.sections.map(({ section, recipes }) => <View key={section} style={styles.mealBlock}><Text style={[styles.mealLabel, { color: theme.mutedForeground }]}>BỮA {sectionLabels[section].toUpperCase()}</Text>{recipes.length ? recipes.map((recipe) => <View key={recipe.id} style={[styles.recipeCard, { borderColor: theme.border, backgroundColor: theme.card }]}><Text style={[styles.recipeTitle, { color: theme.foreground }]}>{recipe.title}</Text>{!draft ? <Pressable accessibilityRole="button" accessibilityLabel={`Đổi món ${recipe.title}`} onPress={() => planner.requestReplacement(activeDay.day, section, recipe.title)}><Text style={[styles.link, { color: theme.primary }]}>Đổi món</Text></Pressable> : null}</View>) : <Text style={[styles.emptyMeal, { color: theme.mutedForeground, borderColor: theme.border }]}>Chưa có món cho bữa này</Text>}</View>)}</View> : null}
        {!draft ? <Pressable accessibilityRole="button" onPress={() => planner.startForm()} style={[styles.outlineButton, styles.askMore, { borderColor: theme.border }]}><Text style={[styles.outlineText, { color: theme.primary }]}>Nhờ trợ lý lên thực đơn mới</Text></Pressable> : null}
      </> : <View style={[styles.emptyPlan, { borderColor: theme.border, backgroundColor: theme.card }]}><Text style={[styles.sectionTitle, { color: theme.foreground }]}>Chưa có thực đơn</Text><Text style={[styles.helper, styles.center, { color: theme.mutedForeground }]}>Hãy nhờ Trợ lý Vedora lên thực đơn, bản đề xuất sẽ hiện ở đây để bạn xem và lưu.</Text><Pressable accessibilityRole="button" onPress={() => planner.startForm()} style={[styles.smallPrimary, { backgroundColor: theme.primary }]}><Text style={[styles.smallPrimaryText, { color: theme.primaryForeground }]}>Nhờ trợ lý lên thực đơn</Text></Pressable></View>}
    </ScrollView>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  screen: { flex: 1 }, center: { textAlign: 'center' },
  header: { minHeight: 84, borderBottomWidth: 1, paddingHorizontal: Spacing.three, flexDirection: 'row', alignItems: 'center' }, headerText: { flex: 1 },
  title: { fontFamily: Fonts.headingBold, fontSize: 22, lineHeight: 31 }, subtitle: { fontFamily: Fonts.sans, fontSize: 12, lineHeight: 18 }, sticker: { width: 68, height: 68 },
  content: { width: '100%', maxWidth: 620, alignSelf: 'center', paddingHorizontal: Spacing.three, paddingTop: Spacing.three, paddingBottom: Spacing.four, gap: Spacing.three },
  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, paddingVertical: Spacing.two }, helper: { fontFamily: Fonts.sans, fontSize: 13, lineHeight: 19 }, error: { fontFamily: Fonts.sansMedium, fontSize: 13, lineHeight: 19 }, link: { fontFamily: Fonts.sansBold, fontSize: 12 },
  notice: { borderWidth: 1, borderRadius: Radius.xl, padding: Spacing.three }, suggestion: { borderWidth: 1, borderRadius: Radius['2xl'], padding: Spacing.three, gap: Spacing.two }, sectionTitle: { fontFamily: Fonts.headingBold, fontSize: 16 },
  smallPrimary: { alignSelf: 'flex-start', minHeight: 38, borderRadius: 19, justifyContent: 'center', paddingHorizontal: Spacing.three }, smallPrimaryText: { fontFamily: Fonts.sansBold, fontSize: 13 },
  outlineButton: { minHeight: 38, borderRadius: 19, borderWidth: 1, justifyContent: 'center', paddingHorizontal: Spacing.three }, outlineText: { fontFamily: Fonts.sansSemibold, fontSize: 13 }, askMore: { alignSelf: 'flex-start' }, actions: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  dayList: { gap: Spacing.two, paddingBottom: Spacing.one }, dayChip: { minHeight: 41, paddingHorizontal: Spacing.three, borderWidth: 1, borderRadius: 21, justifyContent: 'center' }, dayText: { fontFamily: Fonts.sansSemibold, fontSize: 13 },
  dayBody: { gap: Spacing.three }, dayTitle: { fontFamily: Fonts.headingBold, fontSize: 18 }, mealBlock: { gap: Spacing.two }, mealLabel: { fontFamily: Fonts.sansBold, fontSize: 11, letterSpacing: 1 },
  recipeCard: { borderWidth: 1, borderRadius: Radius.xl, minHeight: 52, flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.three, gap: Spacing.two }, recipeTitle: { flex: 1, fontFamily: Fonts.sansSemibold, fontSize: 14 },
  emptyMeal: { borderWidth: 1, borderStyle: 'dashed', borderRadius: Radius.xl, padding: Spacing.three, fontFamily: Fonts.sans, fontSize: 13 }, emptyPlan: { borderWidth: 1, borderRadius: Radius['2xl'], padding: Spacing.four, alignItems: 'center', gap: Spacing.two },
  guest: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.four, gap: Spacing.three }, guestSticker: { width: 120, height: 120 }, guestText: { textAlign: 'center', fontFamily: Fonts.sans, fontSize: 14, lineHeight: 21 }, primaryButton: { alignSelf: 'stretch', minHeight: 48, borderRadius: Radius.xl, alignItems: 'center', justifyContent: 'center' }, primaryText: { fontFamily: Fonts.sansBold, fontSize: 15 },
});
