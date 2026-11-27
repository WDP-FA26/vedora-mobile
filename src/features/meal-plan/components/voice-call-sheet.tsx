import { useCallback, useEffect, useRef, type RefObject } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, View, type ScrollViewInstance } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SymbolView } from 'expo-symbols';
import { useTheme } from '@/hooks/use-theme';
import { Fonts, Radius, Spacing } from '@/constants/theme';
import { NutritionSection } from '@/features/dietary-profile/components/nutrition-section';
import { MealLogScreen } from '@/features/meal-log/components/meal-log-screen';
import { useRecipe } from '@/features/recipes/hooks/use-recipes';
import { formatIngredient } from '@/features/recipes/utils/recipe-format';
import type { MealPlanner } from '../hooks/meal-planner-provider';
import { useMealPlan } from '../hooks/use-meal-plan';
import type { VoiceStatus } from '../services/voice-call';
import { useMealPlannerVoice } from '../hooks/use-meal-planner-voice';
import type { VoiceFocus, VoiceScreen } from '../types/voice.schema';
import { dayLabels, sectionLabels } from '../utils/meal-plan';
import { weekRange } from '../utils/meal-week';

const STATUS: Record<VoiceStatus, string> = { connecting: 'Đang kết nối…', listening: 'Mình đang nghe bạn', speaking: 'Vedora đang nói', thinking: 'Đang xử lý yêu cầu…', muted: 'Mic đang tắt', ending: 'Đang chào tạm biệt…', ended: 'Cuộc gọi đã kết thúc', error: 'Chưa thể tiếp tục cuộc gọi' };

export function VoiceCallSheet({ planner, onClose }: { planner: MealPlanner; onClose: () => void }) {
  const theme = useTheme();
  const { screen, focus, status, error, reply, heard, elapsed, finished, sendContext, scrollRef, scrollProps, closePanel, end, toggleMute, applyScreen, selectDay, setLogDate, retry } = useMealPlannerVoice(planner);
  const token = planner.token;
  const close = () => { end(); onClose(); };
  return <Modal visible animationType="slide" presentationStyle="fullScreen" onRequestClose={close}>
    <SafeAreaView style={[styles.screen, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <View style={styles.flex}>
          <Text accessibilityRole="header" style={[styles.title, { color: theme.foreground }]}>Trò chuyện với Vedora</Text>
          <Text accessibilityLiveRegion="polite" style={[styles.text, { color: theme.primary }]}>{STATUS[status]} · {Math.floor(elapsed / 60)}:{String(elapsed % 60).padStart(2, '0')}</Text>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel="Đóng cuộc gọi" onPress={close} style={styles.control}><SymbolView name={{ ios: 'xmark', android: 'close', web: 'close' }} size={22} tintColor={theme.foreground} /></Pressable>
      </View>
      {screen.panel === 'eatingLog' ? <MealLogScreen key={focus?.kind === 'eatingLog' ? focus.date : 'log'} initialDate={screen.eatingLogDate} onClose={closePanel} scrollRef={scrollRef} scrollProps={scrollProps} onDateChange={setLogDate} />
        : <ScrollView key={screen.panel === 'recipe' ? screen.recipeId : screen.panel} ref={scrollRef} {...scrollProps} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
          {screen.panel !== 'none' ? <Pressable accessibilityRole="button" onPress={closePanel} style={[styles.closePanel, { borderColor: theme.border }]}><Text style={[styles.label, { color: theme.primary }]}>Về thực đơn</Text></Pressable> : null}
          {screen.panel === 'recipe' && focus?.kind === 'recipe' ? <VoiceRecipe focus={focus} scrollRef={scrollRef} onContext={sendContext} onStep={(step) => applyScreen({ close: null, focus: { ...focus, step, section: 'steps' } })} />
            : screen.panel === 'bodyMetrics' && token ? <NutritionSection token={token} />
              : <VoiceCalendar screen={screen} token={token} onDay={selectDay} onRecipe={(id, title) => applyScreen({ close: null, focus: { kind: 'recipe', recipeId: id, title, section: 'top' } })} />}
        </ScrollView>}
      <View style={[styles.footer, { backgroundColor: theme.card, borderTopColor: theme.border }]}>
        {error ? <Text accessibilityRole="alert" style={[styles.text, { color: theme.destructive }]}>{error}</Text> : null}
        {heard ? <Text numberOfLines={2} style={[styles.text, { color: theme.mutedForeground }]}>Bạn: {heard}</Text> : null}
        <Text numberOfLines={3} accessibilityLiveRegion="polite" style={[styles.text, { color: theme.foreground }]}>{reply}</Text>
        <View style={styles.actions}>
          {status === 'connecting' ? <ActivityIndicator color={theme.primary} /> : null}
          {finished ? <Pressable accessibilityRole="button" onPress={retry} style={[styles.button, { backgroundColor: theme.primary }]}><Text style={[styles.label, { color: theme.primaryForeground }]}>Gọi lại</Text></Pressable>
            : <Pressable accessibilityRole="button" accessibilityLabel={status === 'muted' ? 'Bật mic' : 'Tắt mic'} disabled={status === 'connecting'} onPress={toggleMute} style={[styles.button, { backgroundColor: theme.secondary }]}><Text style={[styles.label, { color: theme.secondaryForeground }]}>{status === 'muted' ? 'Bật mic' : 'Tắt mic'}</Text></Pressable>}
          <Pressable accessibilityRole="button" onPress={close} style={[styles.button, { backgroundColor: theme.destructive }]}><Text style={[styles.label, { color: '#fff' }]}>{finished ? 'Đóng' : 'Kết thúc'}</Text></Pressable>
        </View>
        <Text style={[styles.caption, { color: theme.mutedForeground }]}>Cuộc gọi tối đa 5 phút. Thay đổi được lưu vào tài khoản như chat chữ.</Text>
      </View>
    </SafeAreaView>
  </Modal>;
}

function VoiceCalendar({ screen, token, onDay, onRecipe }: { screen: VoiceScreen; token: string | null; onDay: (day: NonNullable<VoiceScreen['day']>) => void; onRecipe: (id: string, title: string) => void }) {
  const theme = useTheme();
  const plan = useMealPlan(token, screen.weekStart);
  return <>
    <Text style={[styles.title, { color: theme.foreground }]}>{weekRange(screen.weekStart)}</Text>
    {plan.isPending ? <ActivityIndicator color={theme.primary} /> : null}
    {plan.isError ? <Pressable accessibilityRole="button" onPress={() => void plan.refetch()}><Text style={[styles.text, { color: theme.destructive }]}>Chưa tải được thực đơn. Chạm để thử lại.</Text></Pressable> : null}
    {plan.data?.days.filter((day) => !screen.day || day.day === screen.day).map((day) => <View key={day.day} style={[styles.card, { borderColor: theme.border }]}>
      <Text style={[styles.title, { color: theme.foreground }]}>{dayLabels[day.day]}</Text>
      {day.sections.map((section) => <View key={section.section} style={styles.section}>
        <Text style={[styles.label, { color: theme.mutedForeground }]}>{sectionLabels[section.section]}</Text>
        {section.recipes.map((recipe) => <Pressable key={recipe.id} accessibilityRole="button" onPress={() => onRecipe(recipe.id, recipe.title)}><Text style={[styles.text, { color: theme.primary }]}>{recipe.title}</Text></Pressable>)}
        {!section.recipes.length ? <Text style={[styles.text, { color: theme.mutedForeground }]}>Chưa có món</Text> : null}
      </View>)}
    </View>)}
    <View style={styles.actions}>{plan.data?.days.map((day) => <Pressable key={day.day} accessibilityRole="button" accessibilityLabel={dayLabels[day.day]} onPress={() => onDay(day.day)} style={styles.control}><Text style={[styles.label, { color: theme.primary }]}>{dayLabels[day.day].replace('Thứ ', 'T')}</Text></Pressable>)}</View>
  </>;
}

function VoiceRecipe({ focus, scrollRef, onContext, onStep }: { focus: Extract<VoiceFocus, { kind: 'recipe' }>; scrollRef: RefObject<ScrollViewInstance | null>; onContext: (text: string) => void; onStep: (step: number) => void }) {
  const theme = useTheme();
  const recipe = useRecipe(focus.recipeId);
  const offsets = useRef<Record<string, number>>({ top: 0 });
  const contentOffset = useRef(0);
  const desired = focus.step ? `step-${focus.step}` : focus.section ?? 'top';
  const go = useCallback(() => { if (offsets.current[desired] !== undefined) scrollRef.current?.scrollTo({ y: contentOffset.current + offsets.current[desired], animated: true }); }, [desired, scrollRef]);
  useEffect(() => { go(); }, [go]);
  useEffect(() => {
    if (recipe.data) onContext(`Công thức đang mở: ${recipe.data.title}, ${recipe.data.servings} khẩu phần. Nguyên liệu: ${recipe.data.ingredients.map(formatIngredient).join(', ')}. Các bước: ${recipe.data.steps.map((step, index) => `${index + 1}. ${step}`).join(' ')}`);
  }, [onContext, recipe.data]);
  if (recipe.isPending) return <ActivityIndicator color={theme.primary} />;
  if (!recipe.data) return <Pressable accessibilityRole="button" onPress={() => void recipe.refetch()}><Text style={[styles.text, { color: theme.destructive }]}>Chưa tải được công thức. Chạm để thử lại.</Text></Pressable>;
  const data = recipe.data;
  return <View style={styles.section} onLayout={(event) => { contentOffset.current = event.nativeEvent.layout.y; go(); }}>
    <Text style={[styles.title, { color: theme.foreground }]}>{data.title}</Text>
    <Text style={[styles.text, { color: theme.mutedForeground }]}>{data.servings} khẩu phần</Text>
    <Text onLayout={(event) => { offsets.current.ingredients = event.nativeEvent.layout.y; go(); }} style={[styles.title, { color: theme.foreground }]}>Nguyên liệu</Text>
    {data.ingredients.map((item) => <Text key={item.ingredientId} style={[styles.text, { color: theme.foreground }]}>• {formatIngredient(item)}</Text>)}
    <Text onLayout={(event) => { offsets.current.steps = event.nativeEvent.layout.y; go(); }} style={[styles.title, { color: theme.foreground }]}>Từng bước vào bếp</Text>
    {data.steps.map((step, index) => <View key={index} onLayout={(event) => { offsets.current[`step-${index + 1}`] = event.nativeEvent.layout.y; go(); }} style={[styles.card, { borderColor: focus.step === index + 1 ? theme.primary : theme.border, backgroundColor: focus.step === index + 1 ? theme.secondary : theme.card }]}>
      <Pressable accessibilityRole="button" accessibilityLabel={`Xem bước ${index + 1}`} onPress={() => onStep(index + 1)}><Text style={[styles.label, { color: theme.primary }]}>Bước {index + 1}</Text></Pressable>
      <Text style={[styles.text, { color: theme.foreground }]}>{step}</Text>
    </View>)}
  </View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1 }, flex: { flex: 1 }, header: { flexDirection: 'row', alignItems: 'center', padding: Spacing.three, gap: Spacing.two, borderBottomWidth: StyleSheet.hairlineWidth },
  title: { fontFamily: Fonts.headingBold, fontSize: 18, lineHeight: 26 }, text: { fontFamily: Fonts.sans, fontSize: 14, lineHeight: 21 }, label: { fontFamily: Fonts.sansBold, fontSize: 14 }, caption: { fontFamily: Fonts.sans, fontSize: 11, lineHeight: 16 },
  content: { padding: Spacing.three, gap: Spacing.three }, section: { gap: Spacing.two }, card: { borderWidth: 1, borderRadius: Radius.xl, padding: Spacing.three, gap: Spacing.two },
  control: { minWidth: 40, minHeight: 44, alignItems: 'center', justifyContent: 'center' }, closePanel: { borderWidth: 1, borderRadius: Radius.xl, padding: Spacing.three, alignItems: 'center' },
  footer: { padding: Spacing.three, gap: Spacing.two, borderTopWidth: StyleSheet.hairlineWidth }, actions: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two, alignItems: 'center' }, button: { flex: 1, minHeight: 46, borderRadius: Radius.xl, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.three },
});
