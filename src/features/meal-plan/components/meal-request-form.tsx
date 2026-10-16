import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Fonts, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { mealSections, type DietaryRestrictions, type MealSection } from '../types/meal-plan.schema';
import { sectionLabels } from '../utils/meal-plan';

type Ingredient = { id: number; name: string; amount: string; unit: string };
type IngredientInput = Omit<Ingredient, 'id'>;
const priorities = ['Đa dạng', 'Nấu nhanh', 'Tiết kiệm', 'Tận dụng nguyên liệu'] as const;
const clean = (value: string) => value.trim().replace(/\s+/gu, ' ');
const ingredientLabel = (item: IngredientInput) =>
  `${clean(item.name)}${clean(item.amount) ? ` (${clean(item.amount)}${clean(item.unit) ? ` ${clean(item.unit)}` : ''})` : ''}`;

export function MealRequestForm({
  restrictions, loading, failed, retry, onContinue, seed,
}: {
  restrictions?: DietaryRestrictions;
  loading: boolean;
  failed: boolean;
  retry: () => void;
  onContinue: (prompt: string) => void;
  seed?: 'week' | 'quick' | 'pantry' | null;
}) {
  const theme = useTheme();
  const [meals, setMeals] = useState<MealSection[]>(['BREAKFAST', 'LUNCH', 'DINNER']);
  const [people, setPeople] = useState('');
  const [minutes, setMinutes] = useState(seed === 'quick' ? '30' : '');
  const [priority, setPriority] = useState<(typeof priorities)[number]>(seed === 'pantry' ? 'Tận dụng nguyên liệu' : 'Đa dạng');
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [editor, setEditor] = useState<IngredientInput>({ name: '', amount: '', unit: '' });
  const [nextId, setNextId] = useState(1);
  const [note, setNote] = useState('');
  const [confirmedSignature, setConfirmedSignature] = useState<string | null>(null);
  const [error, setError] = useState('');
  const avoided = [
    ...(restrictions?.groups.map(({ name }) => name) ?? []),
    ...(restrictions?.ingredients.map(({ name }) => name) ?? []),
  ];
  const profileSignature = JSON.stringify(restrictions ?? null);
  const confirmed = !!restrictions && confirmedSignature === profileSignature;

  function toggleMeal(meal: MealSection) {
    setMeals((current) => current.includes(meal) ? current.filter((item) => item !== meal) : [...current, meal]);
    setError('');
  }

  function amountError(item: IngredientInput) {
    const value = clean(item.amount);
    if (!value) return null;
    const numeric = Number(value.replace(',', '.'));
    return Number.isFinite(numeric) && numeric > 0 && numeric <= 1_000_000
      ? null : 'Khối lượng phải lớn hơn 0 và không quá 1.000.000.';
  }

  function addIngredient() {
    if (!clean(editor.name)) { setError('Nhập tên nguyên liệu.'); return; }
    if (ingredients.length >= 20) { setError('Chỉ thêm tối đa 20 nguyên liệu.'); return; }
    const invalid = amountError(editor);
    if (invalid) { setError(invalid); return; }
    setIngredients((current) => [...current, { ...editor, name: clean(editor.name), id: nextId }]);
    setNextId((id) => id + 1);
    setEditor({ name: '', amount: '', unit: '' });
    setError('');
  }

  function continueToChat() {
    if (loading) { setError('Đợi tải thông tin ăn uống trước khi tiếp tục.'); return; }
    if (failed || !restrictions) { setError('Chưa tải được thực phẩm cần tránh. Hãy thử lại.'); return; }
    if (!confirmed) { setError('Hãy kiểm tra và xác nhận thông tin ăn uống.'); return; }
    if (meals.length === 0) { setError('Chọn ít nhất một bữa.'); return; }
    if (people && (!Number.isInteger(Number(people)) || Number(people) < 1 || Number(people) > 20)) {
      setError('Số người ăn cần từ 1 đến 20.'); return;
    }
    if (minutes && (!Number.isInteger(Number(minutes)) || Number(minutes) < 1 || Number(minutes) > 240)) {
      setError('Thời gian nấu cần từ 1 đến 240 phút.'); return;
    }
    if (note.length > 2500) { setError('Yêu cầu thêm tối đa 2.500 ký tự.'); return; }
    const pending = clean(editor.name);
    if (!pending && (clean(editor.amount) || clean(editor.unit))) {
      setError('Nhập tên cho nguyên liệu đang thêm.'); return;
    }
    if (pending && ingredients.length >= 20) { setError('Chỉ thêm tối đa 20 nguyên liệu.'); return; }
    const invalid = pending ? amountError(editor) : null;
    if (invalid) { setError(invalid); return; }
    const allIngredients = [...ingredients, ...(pending ? [{ ...editor, name: pending, id: nextId }] : [])];
    const prompt = [
      'Hãy đề xuất bản nháp thực đơn 7 ngày lặp theo thứ trong tuần, từ Thứ Hai đến Chủ nhật.',
      `Các bữa cần lập mỗi ngày: ${mealSections.filter((meal) => meals.includes(meal)).map((meal) => sectionLabels[meal].toLowerCase()).join(', ')}.`,
      avoided.length ? `Thực phẩm cần tránh đã lưu: ${avoided.join(', ')}.` : '',
      people ? `Số người ăn: ${people}.` : '',
      minutes ? `Thời gian nấu tối đa mỗi bữa: ${minutes} phút.` : '',
      `Ưu tiên: ${priority.toLowerCase()}.`,
      allIngredients.length ? `Nguyên liệu đang có, hãy ưu tiên tận dụng khi phù hợp: ${allIngredients.map(ingredientLabel).join(', ')}.` : '',
      clean(note) ? `Yêu cầu bổ sung: ${note.trim()}` : '',
      'Hãy cho tôi xem đề xuất trước, tôi sẽ tự quyết định khi nào lưu thực đơn.',
    ].filter(Boolean).join('\n');
    if (prompt.length > 4000) { setError('Yêu cầu quá dài. Hãy rút ngắn ghi chú hoặc bớt nguyên liệu.'); return; }
    setError('');
    onContinue(prompt);
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.heading}>
        <Text style={[styles.title, { color: theme.foreground }]}>Lên thực đơn</Text>
        <Text style={[styles.subtitle, { color: theme.mutedForeground }]}>Điền thông tin rồi đưa yêu cầu sang chat để gửi.</Text>
      </View>

      <View style={[styles.section, { borderTopColor: theme.border }]}>
        <Text style={[styles.sectionTitle, { color: theme.foreground }]}>1. Thực đơn cần lập</Text>
        <Text style={[styles.helper, { color: theme.mutedForeground }]}>7 ngày lặp theo thứ trong tuần</Text>
        <Text style={[styles.label, { color: theme.foreground }]}>Các bữa mỗi ngày</Text>
        <View style={styles.choiceGrid}>
          {mealSections.map((meal) => <Pressable key={meal} accessibilityRole="checkbox" accessibilityState={{ checked: meals.includes(meal) }} onPress={() => toggleMeal(meal)}
            style={[styles.choice, { backgroundColor: meals.includes(meal) ? theme.secondary : theme.card, borderColor: meals.includes(meal) ? theme.primary : theme.border }]}>
            <Text style={[styles.choiceMark, { color: theme.primary }]}>{meals.includes(meal) ? '✓' : '○'}</Text>
            <Text style={[styles.choiceText, { color: theme.foreground }]}>{sectionLabels[meal]}</Text>
          </Pressable>)}
        </View>
        <View style={styles.fieldRow}>
          <View style={styles.halfField}><Text style={[styles.label, { color: theme.foreground }]}>Số người ăn</Text>
            <TextInput accessibilityLabel="Số người ăn" keyboardType="number-pad" value={people} onChangeText={setPeople} placeholder="Ví dụ: 2" placeholderTextColor={theme.mutedForeground} style={[styles.input, { color: theme.foreground, borderColor: theme.border, backgroundColor: theme.card }]} /></View>
          <View style={styles.halfField}><Text style={[styles.label, { color: theme.foreground }]}>Tối đa mỗi bữa</Text>
            <TextInput accessibilityLabel="Thời gian nấu tối đa, phút" keyboardType="number-pad" value={minutes} onChangeText={setMinutes} placeholder="Phút, ví dụ: 30" placeholderTextColor={theme.mutedForeground} style={[styles.input, { color: theme.foreground, borderColor: theme.border, backgroundColor: theme.card }]} /></View>
        </View>
        <Text style={[styles.label, { color: theme.foreground }]}>Ưu tiên</Text>
        <View style={styles.chipRow}>{priorities.map((option) => <Pressable key={option} accessibilityRole="button" accessibilityState={{ selected: priority === option }} onPress={() => setPriority(option)}
          style={[styles.chip, { borderColor: priority === option ? theme.primary : theme.border, backgroundColor: priority === option ? theme.secondary : theme.card }]}>
          <Text style={[styles.chipText, { color: priority === option ? theme.primary : theme.foreground }]}>{option}</Text>
        </Pressable>)}</View>
      </View>

      <View style={[styles.section, { borderTopColor: theme.border }]}>
        <Text style={[styles.sectionTitle, { color: theme.foreground }]}>2. Nguyên liệu đang có</Text>
        <Text style={[styles.helper, { color: theme.mutedForeground }]}>Thêm nguyên liệu cho yêu cầu này. Nguyên liệu trong hồ sơ chưa được đồng bộ lên mobile.</Text>
        {ingredients.map((item) => <View key={item.id} style={[styles.ingredient, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.ingredientText, { color: theme.foreground }]}>{ingredientLabel(item)}</Text>
          <Pressable accessibilityRole="button" accessibilityLabel={`Xóa ${item.name}`} onPress={() => setIngredients((current) => current.filter((entry) => entry.id !== item.id))} hitSlop={8}>
            <Text style={[styles.removeText, { color: theme.destructive }]}>Xóa</Text>
          </Pressable>
        </View>)}
        <View style={[styles.editor, { backgroundColor: theme.secondary }]}>
          <Text style={[styles.label, { color: theme.foreground }]}>Thêm nguyên liệu cho lần này</Text>
          <TextInput accessibilityLabel="Tên nguyên liệu" maxLength={80} value={editor.name} onChangeText={(name) => setEditor((current) => ({ ...current, name }))} placeholder="Tên nguyên liệu, ví dụ cà chua" placeholderTextColor={theme.mutedForeground} style={[styles.input, { color: theme.foreground, borderColor: theme.border, backgroundColor: theme.card }]} />
          <View style={styles.fieldRow}>
            <TextInput accessibilityLabel="Khối lượng nguyên liệu" keyboardType="decimal-pad" maxLength={16} value={editor.amount} onChangeText={(amount) => setEditor((current) => ({ ...current, amount }))} placeholder="Khối lượng" placeholderTextColor={theme.mutedForeground} style={[styles.input, styles.halfField, { color: theme.foreground, borderColor: theme.border, backgroundColor: theme.card }]} />
            <TextInput accessibilityLabel="Đơn vị nguyên liệu" maxLength={20} value={editor.unit} onChangeText={(unit) => setEditor((current) => ({ ...current, unit }))} placeholder="Đơn vị, ví dụ g" placeholderTextColor={theme.mutedForeground} style={[styles.input, styles.halfField, { color: theme.foreground, borderColor: theme.border, backgroundColor: theme.card }]} />
          </View>
          <Pressable accessibilityRole="button" onPress={addIngredient} style={[styles.smallButton, { borderColor: theme.border, backgroundColor: theme.card }]}>
            <Text style={[styles.smallButtonText, { color: theme.primary }]}>＋ Thêm nguyên liệu</Text>
          </Pressable>
        </View>
      </View>

      <View style={[styles.section, { borderTopColor: theme.border }]}>
        <Text style={[styles.sectionTitle, { color: theme.foreground }]}>3. Kiểm tra hồ sơ ăn uống</Text>
        {loading ? <Text style={[styles.helper, { color: theme.mutedForeground }]}>Đang tải thực phẩm cần tránh…</Text> : failed ? (
          <Pressable accessibilityRole="button" onPress={retry}><Text style={[styles.error, { color: theme.destructive }]}>Không tải được hồ sơ ăn uống. Chạm để thử lại.</Text></Pressable>
        ) : <Text style={[styles.profileText, { color: theme.foreground, backgroundColor: theme.secondary }]}>
          <Text style={styles.bold}>Thực phẩm cần tránh đã lưu: </Text>{avoided.length ? avoided.join(', ') : 'Chưa có'}
        </Text>}
        <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: confirmed, disabled: loading || failed }} disabled={loading || failed} onPress={() => setConfirmedSignature(confirmed ? null : profileSignature)} style={styles.confirmRow}>
          <Text style={[styles.confirmMark, { color: theme.primary }]}>{confirmed ? '☑' : '□'}</Text>
          <Text style={[styles.confirmText, { color: theme.foreground }]}>Tôi đã kiểm tra thực phẩm cần tránh ở trên.</Text>
        </Pressable>
      </View>

      <View style={[styles.section, { borderTopColor: theme.border }]}>
        <Text style={[styles.sectionTitle, { color: theme.foreground }]}>4. Yêu cầu thêm</Text>
        <TextInput accessibilityLabel="Yêu cầu thêm cho thực đơn" multiline maxLength={2500} value={note} onChangeText={setNote} placeholder="Ví dụ: bữa tối nhẹ, ít dầu, không lặp món…" placeholderTextColor={theme.mutedForeground} textAlignVertical="top" style={[styles.input, styles.note, { color: theme.foreground, borderColor: theme.border, backgroundColor: theme.card }]} />
      </View>

      {error ? <Text accessibilityRole="alert" style={[styles.error, { color: theme.destructive }]}>{error}</Text> : null}
      <Pressable accessibilityRole="button" onPress={continueToChat} style={[styles.primaryButton, { backgroundColor: theme.primary }]}>
        <Text style={[styles.primaryButtonText, { color: theme.primaryForeground }]}>Đưa yêu cầu vào chat  →</Text>
      </Pressable>
      <Text style={[styles.footer, { color: theme.mutedForeground }]}>Bạn sẽ xem lại và nhấn Gửi trong chat. Thực đơn chỉ được lưu sau khi bạn xác nhận.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingBottom: Spacing.four, gap: Spacing.three },
  heading: { paddingTop: Spacing.two, gap: Spacing.one },
  title: { fontFamily: Fonts.headingBold, fontSize: 21, lineHeight: 29 },
  subtitle: { fontFamily: Fonts.sans, fontSize: 13, lineHeight: 20 },
  section: { borderTopWidth: 1, paddingTop: Spacing.three, gap: Spacing.two },
  sectionTitle: { fontFamily: Fonts.headingBold, fontSize: 16, lineHeight: 24 },
  helper: { fontFamily: Fonts.sans, fontSize: 12, lineHeight: 18 },
  label: { fontFamily: Fonts.sansSemibold, fontSize: 13, lineHeight: 19 },
  choiceGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  choice: { width: '48%', minHeight: 44, borderWidth: 1, borderRadius: Radius.xl, flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.two, gap: Spacing.two },
  choiceMark: { fontFamily: Fonts.sansBold, fontSize: 18 },
  choiceText: { fontFamily: Fonts.sansMedium, fontSize: 14 },
  fieldRow: { flexDirection: 'row', gap: Spacing.two },
  halfField: { flex: 1, minWidth: 0 },
  input: { minHeight: 44, borderWidth: 1, borderRadius: Radius.xl, paddingHorizontal: Spacing.three, fontFamily: Fonts.sans, fontSize: 14 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  chip: { minHeight: 36, justifyContent: 'center', paddingHorizontal: Spacing.three, borderRadius: 18, borderWidth: 1 },
  chipText: { fontFamily: Fonts.sansMedium, fontSize: 13 },
  ingredient: { minHeight: 42, borderWidth: 1, borderRadius: Radius.xl, paddingHorizontal: Spacing.three, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.two },
  ingredientText: { flex: 1, fontFamily: Fonts.sans, fontSize: 14 },
  removeText: { fontFamily: Fonts.sansSemibold, fontSize: 13 },
  editor: { borderRadius: Radius['2xl'], padding: Spacing.three, gap: Spacing.two },
  smallButton: { alignSelf: 'flex-start', minHeight: 36, borderWidth: 1, borderRadius: 18, paddingHorizontal: Spacing.three, justifyContent: 'center' },
  smallButtonText: { fontFamily: Fonts.sansSemibold, fontSize: 13 },
  profileText: { padding: Spacing.three, borderRadius: Radius.xl, fontFamily: Fonts.sans, fontSize: 13, lineHeight: 20 },
  bold: { fontFamily: Fonts.sansBold },
  confirmRow: { minHeight: 40, flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  confirmMark: { fontSize: 23 },
  confirmText: { flex: 1, fontFamily: Fonts.sans, fontSize: 13, lineHeight: 18 },
  note: { minHeight: 92, paddingVertical: Spacing.two },
  error: { fontFamily: Fonts.sansMedium, fontSize: 13, lineHeight: 20 },
  primaryButton: { minHeight: 48, borderRadius: Radius.xl, alignItems: 'center', justifyContent: 'center' },
  primaryButtonText: { fontFamily: Fonts.sansBold, fontSize: 15 },
  footer: { textAlign: 'center', fontFamily: Fonts.sans, fontSize: 12, lineHeight: 18 },
});
