import { useRef, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Fonts, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { mealSections, type MealSection } from '@/features/meal-plan/types/meal-plan.schema';
import { sectionLabels } from '@/features/meal-plan/utils/meal-plan';

import { useAddMealLogEntry, useEstimateCalories } from '../hooks/use-meal-log';
import { MAX_CALORIES, MAX_DETAILS_LENGTH, MAX_NAME_LENGTH, MAX_SERVINGS, MIN_SERVINGS, type CalorieEstimate, type MealLogDay } from '../types/meal-log.schema';
import { mealLogErrorMessage, parseDecimal, vn } from '../utils/meal-log';

export type PlannedRecipe = { section: MealSection; id: string; title: string };

type Props = { token: string; day: MealLogDay; planned: PlannedRecipe[]; onClose: () => void };

/** Adds one dish to a day: a dish from that day's menu, or any other dish with its own kcal. */
export function MealLogEntryForm({ token, day, planned, onClose }: Props) {
  const theme = useTheme();
  const add = useAddMealLogEntry(token);
  const estimate = useEstimateCalories();
  const abort = useRef<AbortController | null>(null);
  const [section, setSection] = useState<MealSection>('LUNCH');
  const [recipeId, setRecipeId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [details, setDetails] = useState('');
  const [servings, setServings] = useState('1');
  const [calories, setCalories] = useState('');
  const [found, setFound] = useState<CalorieEstimate | null>(null);
  const [error, setError] = useState('');
  const options = planned.filter((item) => item.section === section);
  const custom = !recipeId;
  const busy = add.isPending;

  function pick(section: MealSection) {
    setSection(section);
    setRecipeId(null);
    setError('');
  }

  async function lookUp() {
    if (!name.trim()) { setError('Nhập tên món trước để AI tìm kcal.'); return; }
    setError('');
    const controller = new AbortController();
    abort.current = controller;
    try {
      const result = await estimate.mutateAsync({ name: name.trim(), details: details.trim() || undefined, signal: controller.signal });
      if (controller.signal.aborted) return;
      setFound(result);
      if (result.caloriesPerServing === null) setError('AI chưa tìm được số kcal đủ tin cậy. Bạn hãy tự nhập nhé.');
      else setCalories(String(Math.round(result.caloriesPerServing)));
    } catch (caught) {
      if (!controller.signal.aborted) setError(mealLogErrorMessage(caught));
    }
  }

  function stopLookUp() {
    abort.current?.abort();
    estimate.reset();
  }

  async function submit() {
    const amount = parseDecimal(servings);
    if (amount === null || amount < MIN_SERVINGS || amount > MAX_SERVINGS) { setError(`Khẩu phần phải từ ${vn(MIN_SERVINGS)} đến ${MAX_SERVINGS}.`); return; }
    const base = { date: day.date, section, servings: amount };
    let entry;
    if (recipeId) entry = { ...base, recipeId };
    else {
      const kcal = calories.trim() ? parseDecimal(calories) : undefined;
      if (kcal === null || (kcal !== undefined && (kcal < 0 || kcal > MAX_CALORIES))) { setError(`Kcal mỗi khẩu phần phải từ 0 đến ${MAX_CALORIES.toLocaleString('vi-VN')}.`); return; }
      if (!name.trim()) { setError('Nhập tên món hoặc chọn một món trong thực đơn.'); return; }
      // The estimate counts only while the kcal still equals what the AI proposed; a typed number is the user's own.
      const fromAi = found?.caloriesPerServing != null && kcal === Math.round(found.caloriesPerServing);
      entry = { ...base, name: name.trim(), ...(kcal === undefined ? {} : { caloriesPerServing: Math.round(kcal), calorieSource: fromAi ? 'WEB_ESTIMATE' as const : 'USER' as const }), ...(fromAi && found.note ? { calorieNote: found.note.slice(0, 500) } : {}), ...(fromAi ? { calorieReferences: found.references.slice(0, 5) } : {}) };
    }
    try {
      await add.mutateAsync(entry);
      onClose();
    } catch (caught) { setError(mealLogErrorMessage(caught)); }
  }

  const input = [styles.input, { color: theme.foreground, borderColor: theme.border, backgroundColor: theme.background }];
  return <Modal visible animationType="slide" onRequestClose={busy ? undefined : onClose}>
    <SafeAreaView style={[styles.screen, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.screen}>
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
          <View style={styles.flex}><Text style={[styles.title, { color: theme.foreground }]}>Ghi món đã ăn</Text><Text style={[styles.helper, { color: theme.mutedForeground }]}>{day.date.split('-').reverse().join('/')}</Text></View>
          <Pressable accessibilityRole="button" disabled={busy} onPress={onClose} style={[styles.close, { backgroundColor: theme.muted }]}><Text style={[styles.buttonText, { color: theme.foreground }]}>Đóng</Text></Pressable>
        </View>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
          <Text style={[styles.label, { color: theme.foreground }]}>Bữa</Text>
          <View style={styles.chips}>{mealSections.map((item) => <Pressable key={item} accessibilityRole="radio" accessibilityState={{ selected: section === item }} onPress={() => pick(item)} style={[styles.chip, { backgroundColor: section === item ? theme.primary : theme.muted }]}><Text style={[styles.chipText, { color: section === item ? theme.primaryForeground : theme.foreground }]}>{sectionLabels[item]}</Text></Pressable>)}</View>

          {options.length ? <>
            <Text style={[styles.label, { color: theme.foreground }]}>Món trong thực đơn bữa này</Text>
            {options.map((item) => <Pressable key={item.id} accessibilityRole="radio" accessibilityState={{ selected: recipeId === item.id }} onPress={() => { setRecipeId(recipeId === item.id ? null : item.id); setError(''); }} style={[styles.option, { borderColor: recipeId === item.id ? theme.primary : theme.border, backgroundColor: theme.card }]}><Text style={[styles.optionText, { color: theme.foreground }]}>{item.title}</Text></Pressable>)}
            <Text style={[styles.helper, { color: theme.mutedForeground }]}>Hoặc ghi một món khác bên dưới.</Text>
          </> : null}

          {custom ? <>
            <Text style={[styles.label, { color: theme.foreground }]}>Tên món</Text>
            <TextInput accessibilityLabel="Tên món" value={name} maxLength={MAX_NAME_LENGTH} onChangeText={(value) => { setName(value); setFound(null); setError(''); }} placeholder="Ví dụ: Bún riêu chay" placeholderTextColor={theme.mutedForeground} style={input} />
            <Text style={[styles.label, { color: theme.foreground }]}>Mô tả thêm (để AI ước tính sát hơn)</Text>
            <TextInput accessibilityLabel="Mô tả món" value={details} maxLength={MAX_DETAILS_LENGTH} onChangeText={setDetails} placeholder="Ví dụ: tô lớn ở quán, thêm đậu hũ chiên" placeholderTextColor={theme.mutedForeground} style={input} />
            <Text style={[styles.label, { color: theme.foreground }]}>Kcal mỗi khẩu phần</Text>
            <View style={styles.row}>
              <TextInput accessibilityLabel="Kcal mỗi khẩu phần" keyboardType="number-pad" value={calories} onChangeText={(value) => { setCalories(value); setError(''); }} placeholder="Không bắt buộc" placeholderTextColor={theme.mutedForeground} style={[...input, styles.flex]} />
              {estimate.isPending
                ? <Pressable accessibilityRole="button" onPress={stopLookUp} style={[styles.side, { backgroundColor: theme.muted }]}><Text style={[styles.buttonText, { color: theme.foreground }]}>Hủy</Text></Pressable>
                : <Pressable accessibilityRole="button" disabled={busy} onPress={() => void lookUp()} style={[styles.side, { backgroundColor: theme.secondary }]}><Text style={[styles.buttonText, { color: theme.secondaryForeground }]}>AI tìm kcal</Text></Pressable>}
            </View>
            {estimate.isPending ? <View style={styles.row}><ActivityIndicator color={theme.primary} /><Text style={[styles.helper, styles.flex, { color: theme.mutedForeground }]}>Đang tra cứu trên web, có thể mất tới một phút…</Text></View> : null}
            {found?.caloriesPerServing != null ? <View style={[styles.note, { backgroundColor: theme.secondary }]}>
              <Text style={[styles.helper, { color: theme.secondaryForeground }]}>AI ước tính ~{vn(found.caloriesPerServing)} kcal mỗi khẩu phần. Bạn có thể sửa số bên trên.</Text>
              {found.note ? <Text style={[styles.helper, { color: theme.secondaryForeground }]}>{found.note}</Text> : null}
              {found.references.map((ref) => <Text key={ref.url} numberOfLines={1} style={[styles.helper, { color: theme.secondaryForeground }]}>• {ref.title}</Text>)}
            </View> : null}
          </> : null}

          <Text style={[styles.label, { color: theme.foreground }]}>Số khẩu phần</Text>
          <TextInput accessibilityLabel="Số khẩu phần" keyboardType="decimal-pad" value={servings} onChangeText={(value) => { setServings(value); setError(''); }} style={input} />
          {error ? <Text accessibilityRole="alert" style={[styles.helper, { color: theme.destructive }]}>{error}</Text> : null}
        </ScrollView>
        <View style={[styles.footer, { borderTopColor: theme.border, backgroundColor: theme.card }]}>
          <Pressable accessibilityRole="button" disabled={busy || estimate.isPending} onPress={() => void submit()} style={[styles.save, { backgroundColor: theme.primary, opacity: busy || estimate.isPending ? 0.55 : 1 }]}><Text style={[styles.buttonText, { color: theme.primaryForeground }]}>{busy ? 'Đang lưu…' : 'Lưu vào nhật ký'}</Text></Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  </Modal>;
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  flex: { flex: 1, minWidth: 0 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: Spacing.three, borderBottomWidth: StyleSheet.hairlineWidth },
  title: { fontFamily: Fonts.headingBold, fontSize: 18, lineHeight: 26 },
  close: { minHeight: 44, borderRadius: Radius.xl, paddingHorizontal: 16, justifyContent: 'center' },
  content: { width: '100%', maxWidth: 680, alignSelf: 'center', padding: Spacing.three, gap: 10 },
  label: { fontFamily: Fonts.sansBold, fontSize: 14, lineHeight: 21, marginTop: 4 },
  helper: { fontFamily: Fonts.sans, fontSize: 13, lineHeight: 20 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { minHeight: 44, borderRadius: Radius.xl, paddingHorizontal: 16, justifyContent: 'center' },
  chipText: { fontFamily: Fonts.sansSemibold, fontSize: 14, lineHeight: 20 },
  option: { minHeight: 48, borderWidth: 1.5, borderRadius: Radius.xl, paddingHorizontal: 14, paddingVertical: 10, justifyContent: 'center' },
  optionText: { fontFamily: Fonts.sansSemibold, fontSize: 15, lineHeight: 22 },
  input: { minHeight: 48, borderWidth: 1, borderRadius: Radius.xl, paddingHorizontal: 14, paddingVertical: 10, fontFamily: Fonts.sans, fontSize: 15 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  side: { minHeight: 48, borderRadius: Radius.xl, paddingHorizontal: 14, justifyContent: 'center' },
  note: { borderRadius: Radius.xl, padding: Spacing.three, gap: 4 },
  footer: { borderTopWidth: StyleSheet.hairlineWidth, padding: Spacing.three },
  save: { width: '100%', maxWidth: 680, alignSelf: 'center', minHeight: 52, borderRadius: Radius['2xl'], alignItems: 'center', justifyContent: 'center' },
  buttonText: { fontFamily: Fonts.sansBold, fontSize: 15, lineHeight: 22 },
});
