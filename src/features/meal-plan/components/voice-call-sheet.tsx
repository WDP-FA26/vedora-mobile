import { useCallback, useEffect, useRef, type RefObject } from 'react';
import { Image } from 'expo-image';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, View, type ScrollViewInstance } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SymbolView } from 'expo-symbols';
import { SproutPet } from '@/features/nutrition-chat/components/sprout-pet';
import { useTheme } from '@/hooks/use-theme';
import { BrandColors, Fonts, Radius, Spacing } from '@/constants/theme';
import { NutritionSection } from '@/features/dietary-profile/components/nutrition-section';
import { MealLogScreen } from '@/features/meal-log/components/meal-log-screen';
import { useRecipe } from '@/features/recipes/hooks/use-recipes';
import { formatIngredient, recipeMinutes } from '@/features/recipes/utils/recipe-format';
import type { MealPlanner } from '../hooks/meal-planner-provider';
import { useMealPlannerVoice } from '../hooks/use-meal-planner-voice';
import type { VoiceFocus } from '../types/voice.schema';
import { VoiceCallControls } from './voice-call-controls';
import { VoiceCalendar } from './voice-calendar';
import { VoiceScreenGlow } from './voice-screen-glow';
import { VoiceAudioHost } from './voice-audio-host';
import { ShoppingListPanel } from './shopping-list-panel';

export function VoiceCallSheet({ planner, onClose }: { planner: MealPlanner; onClose: () => void }) {
  const theme = useTheme();
  const { screen, focus, status, error, reply, heard, elapsed, highlight, glowing, sendContext, scrollRef, scrollProps, closePanel, end, toggleMute, interrupt, applyScreen, selectDay, setLogDate, setShoppingSnapshot, retry } = useMealPlannerVoice(planner);
  const token = planner.token;
  const close = () => { end(); onClose(); };
  return <Modal visible animationType="slide" presentationStyle="fullScreen" onRequestClose={close}>
    <SafeAreaView style={[styles.screen, { backgroundColor: theme.background }]}>
      <VoiceAudioHost />
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <View style={styles.headerInner}>
          <View style={[styles.callAvatar, { backgroundColor: theme.secondary }]}><SproutPet size={38} accessible={false} /></View>
          <View style={styles.flex}>
            <Text accessibilityRole="header" style={[styles.title, { color: theme.foreground }]}>Vedora Voice</Text>
            <Text style={[styles.caption, { color: theme.mutedForeground }]}>Trò chuyện cùng trợ lý món chay</Text>
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel="Đóng cuộc gọi" onPress={close} style={({ pressed }) => [styles.control, { backgroundColor: theme.muted, opacity: pressed ? 0.7 : 1 }]}><SymbolView name={{ ios: 'xmark', android: 'close', web: 'close' }} size={22} tintColor={theme.foreground} /></Pressable>
        </View>
      </View>
      {screen.panel === 'eatingLog' ? <MealLogScreen key={focus?.kind === 'eatingLog' ? focus.date : 'log'} initialDate={screen.eatingLogDate} onClose={closePanel} scrollRef={scrollRef} scrollProps={scrollProps} onDateChange={setLogDate} />
        : <ScrollView key={screen.panel === 'recipe' ? screen.recipeId : screen.panel} ref={scrollRef} {...scrollProps} style={styles.screen} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
          {screen.panel === 'none' ? <View style={styles.hero}>
            <View style={styles.heroCopy}>
              <View style={styles.heroTag}><Text style={styles.eyebrow}>TRỢ LÝ MÓN CHAY</Text></View>
              <Text style={styles.heroTitle}>Cùng trò chuyện,{'\n'}bữa ăn thêm xanh.</Text>
              <Text style={styles.heroSub}>Thử nói: “Gợi ý bữa tối hôm nay”.</Text>
            </View>
            <View style={styles.stickerFrame} pointerEvents="none">
              <Image source={require('@/assets/branding/avocado-sticker.png')} style={styles.heroSticker} contentFit="contain" accessible={false} />
            </View>
          </View> : <Pressable accessibilityRole="button" onPress={closePanel} style={[styles.closePanel, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <SymbolView name={{ ios: 'arrow.left', android: 'arrow_back', web: 'arrow_back' }} size={18} tintColor={theme.primary} />
            <Text style={[styles.label, { color: theme.primary }]}>Về thực đơn</Text>
          </Pressable>}
          {screen.panel === 'recipe' && focus?.kind === 'recipe' ? <VoiceRecipe focus={focus} scrollRef={scrollRef} onContext={sendContext} onStep={(step) => applyScreen({ close: null, focus: { ...focus, step, section: 'steps' } })} />
            : screen.panel === 'shoppingList' ? <ShoppingListPanel key={screen.weekStart} weekStart={screen.weekStart} command={focus?.kind === 'shoppingList' ? focus : undefined} onSnapshot={setShoppingSnapshot} onContext={sendContext} onRecipe={(id, title) => applyScreen({ close: null, focus: { kind: 'recipe', recipeId: id, title, section: 'top' } })} />
            : screen.panel === 'bodyMetrics' && token ? <NutritionSection token={token} />
              : <VoiceCalendar key={screen.weekStart} screen={screen} token={token} highlight={highlight} scrollRef={scrollRef} onDay={selectDay} onRecipe={(id, title) => applyScreen({ close: null, focus: { kind: 'recipe', recipeId: id, title, section: 'top' } })} />}
        </ScrollView>}
      <VoiceCallControls status={status} error={error} reply={reply} heard={heard} elapsed={elapsed} onClose={close} onRetry={retry} onToggleMute={toggleMute} onInterrupt={interrupt} />
      <VoiceScreenGlow active={glowing} />
    </SafeAreaView>
  </Modal>;
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
  const minutes = recipeMinutes(data);
  return <View style={styles.recipeContent} onLayout={(event) => { contentOffset.current = event.nativeEvent.layout.y; go(); }}>
    <View style={[styles.recipeIntro, { backgroundColor: theme.secondary }]}>
      <View style={[styles.flex, styles.section]}>
        <Text style={[styles.kicker, { color: theme.primary }]}>CÙNG VÀO BẾP</Text>
        <Text accessibilityRole="header" style={[styles.recipeTitle, { color: theme.foreground }]}>{data.title}</Text>
        <Text style={[styles.caption, { color: theme.mutedForeground }]}>{[minutes !== null ? `${minutes} phút` : null, `${data.servings} khẩu phần`].filter(Boolean).join(' · ')}</Text>
      </View>
      <Image source={require('@/assets/branding/carrot-sticker.png')} style={styles.recipeSticker} contentFit="contain" accessible={false} />
    </View>
    {data.conflicts.length ? <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.destructive }]}>
      <Text style={[styles.label, { color: theme.destructive }]}>Lưu ý kết hợp nguyên liệu</Text>
      {data.conflicts.map((conflict) => <Text key={conflict.ruleId} style={[styles.text, { color: theme.foreground }]}>{conflict.a.name} + {conflict.b.name}: {conflict.reason}</Text>)}
    </View> : null}
    <View onLayout={(event) => { offsets.current.ingredients = event.nativeEvent.layout.y; go(); }} style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <View style={styles.dayHeading}>
        <Text accessibilityRole="header" style={[styles.title, styles.flex, { color: theme.foreground }]}>Nguyên liệu</Text>
        <View style={[styles.countBadge, { backgroundColor: theme.secondary }]}><Text style={[styles.smallLabel, { color: theme.primary }]}>{data.ingredients.length} loại</Text></View>
      </View>
      {data.ingredients.map((item, index) => <View key={`${item.ingredientId}-${item.name}`} style={[styles.ingredientRow, { borderTopColor: theme.border, borderTopWidth: index === 0 ? 0 : StyleSheet.hairlineWidth }]}>
        <View style={[styles.ingredientDot, { backgroundColor: theme.primary }]} />
        <Text style={[styles.text, styles.flex, { color: theme.foreground }]}>{formatIngredient(item)}</Text>
      </View>)}
      {!data.ingredients.length ? <Text style={[styles.text, { color: theme.mutedForeground }]}>Công thức chưa cập nhật nguyên liệu.</Text> : null}
    </View>
    <View style={styles.stepsHeading} onLayout={(event) => { offsets.current.steps = event.nativeEvent.layout.y; go(); }}>
      <Text accessibilityRole="header" style={[styles.title, { color: theme.foreground }]}>Từng bước vào bếp</Text>
      <Text style={[styles.caption, { color: theme.mutedForeground }]}>{data.steps.length} bước thực hiện · Chạm để chọn bước</Text>
    </View>
    {data.steps.map((step, index) => <Pressable key={index} accessibilityRole="button" accessibilityLabel={`Xem bước ${index + 1}`} accessibilityState={{ selected: focus.step === index + 1 }} onPress={() => onStep(index + 1)}
      onLayout={(event) => { offsets.current[`step-${index + 1}`] = event.nativeEvent.layout.y; go(); }}
      style={[styles.step, { borderColor: focus.step === index + 1 ? theme.primary : theme.border, backgroundColor: focus.step === index + 1 ? theme.secondary : theme.card }]}>
      <View style={[styles.stepNumber, { backgroundColor: focus.step === index + 1 ? theme.primary : theme.secondary }]}><Text style={[styles.label, { color: focus.step === index + 1 ? theme.primaryForeground : theme.primary }]}>{String(index + 1).padStart(2, '0')}</Text></View>
      <View style={[styles.flex, styles.section]}>
        <Text style={[styles.smallLabel, { color: theme.primary }]}>{focus.step === index + 1 ? `Bước ${index + 1} · Đang xem` : `Bước ${index + 1}`}</Text>
        <Text style={[styles.text, { color: theme.foreground }]}>{step}</Text>
      </View>
    </Pressable>)}
    {!data.steps.length ? <Text style={[styles.text, { color: theme.mutedForeground }]}>Công thức chưa cập nhật cách nấu.</Text> : null}
  </View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  flex: { flex: 1 },
  header: { paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  headerInner: { width: '100%', maxWidth: 680, alignSelf: 'center', flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.three, gap: 12 },
  callAvatar: { width: 48, height: 48, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  control: { width: 44, height: 44, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: Fonts.headingBold, fontSize: 18, lineHeight: 27 },
  text: { fontFamily: Fonts.sans, fontSize: 15, lineHeight: 24 },
  label: { fontFamily: Fonts.sansBold, fontSize: 14, lineHeight: 21 },
  caption: { fontFamily: Fonts.sans, fontSize: 13, lineHeight: 20 },
  smallLabel: { fontFamily: Fonts.sansSemibold, fontSize: 12, lineHeight: 18 },
  content: { width: '100%', maxWidth: 680, alignSelf: 'center', padding: Spacing.three, paddingBottom: Spacing.four, gap: Spacing.three },
  section: { gap: Spacing.two },
  hero: { backgroundColor: BrandColors.forest, borderRadius: Radius['4xl'], padding: 20, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: Spacing.two, overflow: 'hidden' },
  heroCopy: { flexBasis: 155, flexGrow: 1, flexShrink: 1, gap: 12 },
  heroTag: { alignSelf: 'flex-start', backgroundColor: BrandColors.cream, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  eyebrow: { fontFamily: Fonts.sansBold, fontSize: 10, lineHeight: 16, letterSpacing: 1, color: BrandColors.forest },
  heroTitle: { fontFamily: Fonts.headingBold, fontSize: 22, lineHeight: 33, color: '#fffefa' },
  heroSub: { fontFamily: Fonts.sans, fontSize: 14, lineHeight: 22, color: '#e4f1dc' },
  stickerFrame: { width: 82, height: 108, justifyContent: 'center', alignItems: 'center', borderRadius: 41, backgroundColor: '#ffffff12', transform: [{ rotate: '8deg' }] },
  heroSticker: { width: 84, height: 108 },
  closePanel: { alignSelf: 'flex-start', minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: Spacing.two, paddingHorizontal: Spacing.three, paddingVertical: Spacing.two, borderWidth: 1, borderRadius: Radius['4xl'] },
  dayHeading: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  countBadge: { borderRadius: Radius['4xl'], paddingHorizontal: 12, paddingVertical: 6, flexShrink: 1 },
  card: { borderWidth: 1, borderRadius: Radius['3xl'], padding: Spacing.three, gap: Spacing.three },
  recipeContent: { gap: Spacing.three },
  recipeIntro: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, padding: Spacing.three, borderRadius: Radius['3xl'] },
  recipeTitle: { fontFamily: Fonts.headingBold, fontSize: 22, lineHeight: 32 },
  kicker: { fontFamily: Fonts.sansBold, fontSize: 10, lineHeight: 16, letterSpacing: 1 },
  recipeSticker: { width: 50, height: 72, transform: [{ rotate: '10deg' }] },
  ingredientRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingTop: 12 },
  ingredientDot: { width: 6, height: 6, borderRadius: 3, marginTop: 9 },
  stepsHeading: { gap: 4, paddingTop: Spacing.two },
  step: { flexDirection: 'row', gap: 12, borderWidth: 1, borderRadius: Radius['3xl'], padding: Spacing.three, minHeight: 64 },
  stepNumber: { minWidth: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
});
