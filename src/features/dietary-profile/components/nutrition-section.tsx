import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Fonts, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { ApiError } from '@/shared/api/api-error';

import { activityLabels, bmiLabels, feelingLabels, goalLabels, sexLabels } from '../data/nutrition-labels';
import { useCheckInWeight, useNutrition, useSaveNutrition } from '../hooks/use-nutrition';
import { activityLevels, biologicalSexes, bodyFeelings, nutritionGoals, nutritionInputSchema, type BodyFeeling, type NutritionProfile } from '../types/nutrition.schema';
import { formatKg, formatShortDate, parseNumber, toForm, type NutritionForm } from '../utils/nutrition-form';

const HISTORY_BARS = 14;
const NUMBER_FIELDS = [
  { key: 'heightCm', label: 'Chiều cao (cm)', hint: '100–250' },
  { key: 'weightKg', label: 'Cân nặng (kg)', hint: '25–300' },
  { key: 'targetWeightKg', label: 'Cân nặng mục tiêu (kg)', hint: 'Không bắt buộc' },
  { key: 'birthYear', label: 'Năm sinh', hint: '1920–2020' },
] as const;

function Choices<T extends string>({ label, values, selected, names, onChange, disabled }: { label: string; values: readonly T[]; selected: T | null; names: Record<T, string>; onChange: (value: T | null) => void; disabled: boolean }) {
  const theme = useTheme();
  return <View style={styles.group}>
    <Text style={[styles.label, { color: theme.foreground }]}>{label}</Text>
    <View style={styles.chips}>{values.map((value) => {
      const on = selected === value;
      return <Pressable key={value} accessibilityRole="radio" accessibilityState={{ selected: on, disabled }} disabled={disabled} onPress={() => onChange(on ? null : value)} style={[styles.chip, { backgroundColor: on ? theme.primary : theme.muted }]}>
        <Text style={[styles.chipText, { color: on ? theme.primaryForeground : theme.foreground }]}>{names[value]}</Text>
      </Pressable>;
    })}</View>
  </View>;
}

function Summary({ data }: { data: NutritionProfile }) {
  const theme = useTheme();
  if (data.bmi === null || !data.bmiCategory) return <Text style={[styles.helper, { color: theme.mutedForeground }]}>Nhập chiều cao và cân nặng để Vedora tính BMI theo chuẩn Châu Á.</Text>;
  const category = bmiLabels[data.bmiCategory];
  return <View style={[styles.summary, { backgroundColor: theme.secondary }]}>
    <View style={styles.summaryTop}>
      <Text style={[styles.bmi, { color: theme.primary }]}>{data.bmi.toLocaleString('vi-VN', { maximumFractionDigits: 1 })}</Text>
      <View style={styles.flex}><Text style={[styles.label, { color: theme.foreground }]}>BMI · {category.label}</Text><Text style={[styles.helper, { color: theme.secondaryForeground }]}>{category.description}</Text></View>
    </View>
    {data.idealWeightMinKg !== null && data.idealWeightMaxKg !== null ? <Text style={[styles.helper, { color: theme.secondaryForeground }]}>Cân nặng hài hòa: {formatKg(data.idealWeightMinKg)} – {formatKg(data.idealWeightMaxKg)} kg</Text> : null}
    {data.dailyCalorieTarget !== null ? <Text style={[styles.helper, { color: theme.secondaryForeground }]}>Năng lượng gợi ý mỗi ngày: ~{data.dailyCalorieTarget.toLocaleString('vi-VN')} kcal{data.dailyCalorieMin !== null && data.dailyCalorieMax !== null ? ` (${data.dailyCalorieMin.toLocaleString('vi-VN')} – ${data.dailyCalorieMax.toLocaleString('vi-VN')})` : ''}</Text> : null}
    {data.effectiveGoal ? <Text style={[styles.helper, { color: theme.secondaryForeground }]}>Mục tiêu: {goalLabels[data.effectiveGoal].label}</Text> : null}
    {data.safetyNote ? <Text style={[styles.helper, { color: theme.secondaryForeground }]}>{data.safetyNote}</Text> : null}
  </View>;
}

function WeightHistory({ history }: { history: NutritionProfile['history'] }) {
  const theme = useTheme();
  const shown = history.slice(-HISTORY_BARS);
  if (shown.length < 2) return null;
  const weights = shown.map((item) => item.weightKg);
  const low = Math.min(...weights);
  const span = Math.max(...weights) - low || 1;
  return <View style={styles.group}>
    <Text style={[styles.label, { color: theme.foreground }]}>Cân nặng {shown.length} lần ghi gần nhất</Text>
    <View accessible accessibilityLabel={`Cân nặng từ ${formatKg(shown[0].weightKg)} kg đến ${formatKg(shown[shown.length - 1].weightKg)} kg`} style={styles.bars}>
      {shown.map((item) => <View key={item.id} style={styles.barSlot}><View style={[styles.bar, { height: 12 + ((item.weightKg - low) / span) * 52, backgroundColor: theme.primary }]} /></View>)}
    </View>
    <View style={styles.axis}><Text style={[styles.helper, { color: theme.mutedForeground }]}>{formatShortDate(shown[0].date)} · {formatKg(shown[0].weightKg)} kg</Text><Text style={[styles.helper, { color: theme.mutedForeground }]}>{formatShortDate(shown[shown.length - 1].date)} · {formatKg(shown[shown.length - 1].weightKg)} kg</Text></View>
  </View>;
}

function NutritionEditor({ data, token }: { data: NutritionProfile; token: string }) {
  const theme = useTheme();
  const save = useSaveNutrition(token);
  const checkIn = useCheckInWeight(token);
  const [draft, setDraft] = useState<NutritionForm | null>(null);
  const [weight, setWeight] = useState('');
  const [feeling, setFeeling] = useState<BodyFeeling | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const saved = toForm(data);
  const form = draft ?? saved;
  const dirty = JSON.stringify(form) !== JSON.stringify(saved);
  const busy = save.isPending || checkIn.isPending;

  function change(patch: Partial<NutritionForm>) {
    setDraft({ ...form, ...patch });
    setError('');
    setNotice('');
  }

  function failure(caught: unknown) {
    setError(caught instanceof ApiError && caught.code === 'UNSAFE_TARGET_WEIGHT'
      ? 'Cân nặng mục tiêu quá thấp so với chiều cao. Hãy chọn mức an toàn hơn.'
      : 'Không lưu được. Các số bạn nhập vẫn còn để thử lại.');
  }

  async function submit() {
    const numbers = { heightCm: parseNumber(form.heightCm), weightKg: parseNumber(form.weightKg), targetWeightKg: parseNumber(form.targetWeightKg), birthYear: parseNumber(form.birthYear) };
    const parsed = nutritionInputSchema.safeParse({ ...form, ...numbers });
    if (!parsed.success) { setError('Hãy kiểm tra lại số đã nhập: chiều cao là số nguyên 100–250, cân nặng 25–300 kg, năm sinh 1920–2020.'); return; }
    try {
      const result = await save.mutateAsync(parsed.data);
      setDraft(null);
      setNotice(result.bmi === null ? 'Đã lưu chỉ số cơ thể.' : 'Đã lưu và cập nhật BMI.');
    } catch (caught) { failure(caught); }
  }

  async function logWeight() {
    const value = parseNumber(weight);
    if (value === null || value === undefined || value < 25 || value > 300) { setError('Cân nặng phải từ 25 đến 300 kg.'); return; }
    try {
      await checkIn.mutateAsync({ weightKg: value, feeling });
      setDraft(null);
      setWeight('');
      setFeeling(null);
      setNotice('Đã ghi cân nặng hôm nay.');
    } catch (caught) { failure(caught); }
  }

  return <>
    <Summary data={data} />
    <View style={styles.fields}>{NUMBER_FIELDS.map(({ key, label, hint }) => <View key={key} style={styles.field}>
      <Text style={[styles.label, { color: theme.foreground }]}>{label}</Text>
      <TextInput accessibilityLabel={label} editable={!busy} keyboardType={key === 'weightKg' || key === 'targetWeightKg' ? 'decimal-pad' : 'number-pad'} value={form[key]} onChangeText={(value) => change({ [key]: value })} placeholder={hint} placeholderTextColor={theme.mutedForeground} style={[styles.input, { color: theme.foreground, borderColor: theme.border, backgroundColor: theme.background }]} />
    </View>)}</View>
    <Choices label="Giới tính" values={biologicalSexes} selected={form.biologicalSex} names={sexLabels} disabled={busy} onChange={(value) => change({ biologicalSex: value })} />
    <Choices label="Mức vận động" values={activityLevels} selected={form.activityLevel} names={Object.fromEntries(activityLevels.map((level) => [level, activityLabels[level].label])) as Record<(typeof activityLevels)[number], string>} disabled={busy} onChange={(value) => change({ activityLevel: value })} />
    {form.activityLevel ? <Text style={[styles.helper, { color: theme.mutedForeground }]}>{activityLabels[form.activityLevel].hint}</Text> : null}
    <Choices label="Mục tiêu" values={nutritionGoals} selected={form.nutritionGoal} names={Object.fromEntries(nutritionGoals.map((goal) => [goal, goalLabels[goal].label])) as Record<(typeof nutritionGoals)[number], string>} disabled={busy} onChange={(value) => change({ nutritionGoal: value })} />
    {form.nutritionGoal ? <Text style={[styles.helper, { color: theme.mutedForeground }]}>{goalLabels[form.nutritionGoal].hint}</Text> : null}
    <Pressable accessibilityRole="button" disabled={!dirty || busy} onPress={() => void submit()} style={[styles.button, { backgroundColor: theme.primary, opacity: !dirty || busy ? 0.55 : 1 }]}>
      <Text style={[styles.buttonText, { color: theme.primaryForeground }]}>{save.isPending ? 'Đang lưu…' : 'Lưu chỉ số cơ thể'}</Text>
    </Pressable>

    <View style={[styles.divider, { backgroundColor: theme.border }]} />
    <Text style={[styles.label, { color: theme.foreground }]}>Ghi cân nặng hôm nay</Text>
    <TextInput accessibilityLabel="Cân nặng hôm nay (kg)" editable={!busy} keyboardType="decimal-pad" value={weight} onChangeText={(value) => { setWeight(value); setError(''); setNotice(''); }} placeholder="Ví dụ: 58,5" placeholderTextColor={theme.mutedForeground} style={[styles.input, { color: theme.foreground, borderColor: theme.border, backgroundColor: theme.background }]} />
    <Choices label="Hôm nay bạn cảm thấy" values={bodyFeelings} selected={feeling} names={feelingLabels} disabled={busy} onChange={setFeeling} />
    <Pressable accessibilityRole="button" disabled={!weight.trim() || busy} onPress={() => void logWeight()} style={[styles.button, { backgroundColor: theme.secondary, opacity: !weight.trim() || busy ? 0.55 : 1 }]}>
      <Text style={[styles.buttonText, { color: theme.secondaryForeground }]}>{checkIn.isPending ? 'Đang ghi…' : 'Ghi cân nặng'}</Text>
    </Pressable>
    <WeightHistory history={data.history} />
    {error ? <Text accessibilityRole="alert" style={[styles.helper, { color: theme.destructive }]}>{error}</Text> : null}
    {notice ? <Text accessibilityRole="alert" style={[styles.helper, { color: theme.primary }]}>{notice}</Text> : null}
  </>;
}

/** BMI, calorie target and weight tracking, shown on the dietary profile screen. */
export function NutritionSection({ token }: { token: string }) {
  const theme = useTheme();
  const nutrition = useNutrition(token);
  return <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
    <Text style={[styles.title, { color: theme.foreground }]}>Cơ thể & BMI</Text>
    <Text style={[styles.helper, { color: theme.mutedForeground }]}>Vedora dùng các chỉ số này để gợi ý năng lượng mỗi ngày cho thực đơn và nhật ký ăn.</Text>
    {nutrition.isPending ? <View style={styles.loading}><ActivityIndicator color={theme.primary} /><Text style={[styles.helper, { color: theme.mutedForeground }]}>Đang tải chỉ số…</Text></View> : null}
    {nutrition.isError ? <Pressable accessibilityRole="button" onPress={() => void nutrition.refetch()}><Text style={[styles.helper, { color: theme.destructive }]}>Chưa tải được chỉ số cơ thể. Chạm để thử lại.</Text></Pressable> : null}
    {nutrition.data ? <NutritionEditor data={nutrition.data} token={token} /> : null}
  </View>;
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  card: { borderWidth: 1, borderRadius: Radius['3xl'], padding: Spacing.three, gap: 12 },
  title: { fontFamily: Fonts.headingBold, fontSize: 17, lineHeight: 26 },
  helper: { fontFamily: Fonts.sans, fontSize: 13, lineHeight: 20 },
  loading: { flexDirection: 'row', gap: Spacing.two, alignItems: 'center' },
  summary: { borderRadius: Radius['2xl'], padding: Spacing.three, gap: 6 },
  summaryTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  bmi: { fontFamily: Fonts.headingBold, fontSize: 30, lineHeight: 38 },
  fields: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  field: { flexBasis: 150, flexGrow: 1, gap: 6 },
  label: { fontFamily: Fonts.sansBold, fontSize: 14, lineHeight: 21 },
  input: { minHeight: 48, borderWidth: 1, borderRadius: Radius.xl, paddingHorizontal: 14, paddingVertical: 10, fontFamily: Fonts.sans, fontSize: 15 },
  group: { gap: 8 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { minHeight: 44, borderRadius: Radius.xl, paddingHorizontal: 14, justifyContent: 'center' },
  chipText: { fontFamily: Fonts.sansSemibold, fontSize: 13, lineHeight: 20 },
  button: { minHeight: 50, borderRadius: Radius['2xl'], alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 },
  buttonText: { fontFamily: Fonts.sansBold, fontSize: 15, lineHeight: 22 },
  divider: { height: StyleSheet.hairlineWidth },
  bars: { height: 76, flexDirection: 'row', alignItems: 'flex-end', gap: 4 },
  barSlot: { flex: 1, justifyContent: 'flex-end' },
  bar: { borderRadius: 4 },
  axis: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
});
