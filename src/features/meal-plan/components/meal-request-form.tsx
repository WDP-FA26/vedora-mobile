import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useState, type ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { Fonts, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { mealSections, type DietaryRestrictions, type MealSection } from '../types/meal-plan.schema';
import { sectionLabels } from '../utils/meal-plan';

type Ingredient = { id: number; name: string; amount: string; unit: string };
type IngredientInput = Omit<Ingredient, 'id'>;
type Seed = 'week' | 'quick' | 'pantry' | null | undefined;

const priorities = ['Đa dạng', 'Nấu nhanh', 'Tiết kiệm', 'Tận dụng nguyên liệu'] as const;
const PEOPLE_OPTIONS = [1, 2, 3, 4, 5, 6] as const;
const MINUTE_OPTIONS = [15, 30, 45, 60, null] as const;
const EMPTY_INGREDIENT: IngredientInput = { name: '', amount: '', unit: '' };

const clean = (value: string) => value.trim().replace(/\s+/gu, ' ');
const ingredientLabel = (item: IngredientInput) =>
  `${clean(item.name)}${clean(item.amount) ? ` (${clean(item.amount)}${clean(item.unit) ? ` ${clean(item.unit)}` : ''})` : ''}`;

function amountError(item: IngredientInput) {
  const value = clean(item.amount);
  if (!value) return null;
  const numeric = Number(value.replace(',', '.'));
  return Number.isFinite(numeric) && numeric > 0 && numeric <= 1_000_000 ? null : 'Khối lượng phải lớn hơn 0 và không quá 1.000.000.';
}

type FormProps = {
  restrictions?: DietaryRestrictions;
  loading: boolean;
  failed: boolean;
  /** True while the assistant is already answering. */
  busy?: boolean;
  retry: () => void;
  /** Sends the request straight to the assistant. */
  onSubmit: (prompt: string) => void;
  /** Puts the request into the chat box so it can be read and edited before sending. */
  onReview: (prompt: string) => void;
  onClose: () => void;
  seed?: Seed;
};

/** Request form: essentials up front, extras collapsed, and a sticky footer with the send button. */
export function MealRequestForm({ restrictions, loading, failed, busy, retry, onSubmit, onReview, onClose, seed }: FormProps) {
  const theme = useTheme();
  const [meals, setMeals] = useState<MealSection[]>(['BREAKFAST', 'LUNCH', 'DINNER']);
  const [people, setPeople] = useState<number | null>(null);
  const [minutes, setMinutes] = useState<number | null>(seed === 'quick' ? 30 : null);
  const [priority, setPriority] = useState<(typeof priorities)[number]>(seed === 'pantry' ? 'Tận dụng nguyên liệu' : 'Đa dạng');
  const [pantryOpen, setPantryOpen] = useState(seed === 'pantry');
  const [noteOpen, setNoteOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [editor, setEditor] = useState<IngredientInput>(EMPTY_INGREDIENT);
  const [nextId, setNextId] = useState(1);
  const [note, setNote] = useState('');
  const [ingredientError, setIngredientError] = useState('');
  const [submitError, setSubmitError] = useState('');

  const avoided = [
    ...(restrictions?.groups.map(({ name }) => name) ?? []),
    ...(restrictions?.ingredients.map(({ name }) => name) ?? []),
  ];
  const profileReady = !loading && !failed && !!restrictions;
  const noMeals = meals.length === 0;
  const canSubmit = profileReady && !noMeals && !busy;

  function toggleMeal(meal: MealSection) {
    setMeals((current) => (current.includes(meal) ? current.filter((item) => item !== meal) : [...current, meal]));
    setSubmitError('');
  }

  function currentEditor(): IngredientInput {
    return detailOpen ? editor : { ...editor, amount: '', unit: '' };
  }

  function addIngredient() {
    const item = currentEditor();
    if (!clean(item.name)) { setIngredientError('Nhập tên nguyên liệu.'); return; }
    if (ingredients.length >= 20) { setIngredientError('Chỉ thêm tối đa 20 nguyên liệu.'); return; }
    const invalid = amountError(item);
    if (invalid) { setIngredientError(invalid); return; }
    setIngredients((current) => [...current, { ...item, name: clean(item.name), id: nextId }]);
    setNextId((id) => id + 1);
    setEditor(EMPTY_INGREDIENT);
    setIngredientError('');
  }

  /** Builds the request text, or returns null after showing why it can't be sent. */
  function buildPrompt() {
    if (!canSubmit) return null;
    if (note.length > 2500) { setSubmitError('Yêu cầu thêm tối đa 2.500 ký tự.'); setNoteOpen(true); return null; }
    const pending = currentEditor();
    const hasPending = !!clean(pending.name);
    if (!hasPending && (clean(pending.amount) || clean(pending.unit))) {
      setIngredientError('Nhập tên cho nguyên liệu đang thêm.'); setPantryOpen(true); return null;
    }
    if (hasPending && ingredients.length >= 20) { setIngredientError('Chỉ thêm tối đa 20 nguyên liệu.'); setPantryOpen(true); return null; }
    const invalid = hasPending ? amountError(pending) : null;
    if (invalid) { setIngredientError(invalid); setPantryOpen(true); return null; }
    const all = [...ingredients, ...(hasPending ? [{ ...pending, name: clean(pending.name), id: nextId }] : [])];
    const prompt = [
      'Hãy đề xuất bản nháp thực đơn 7 ngày lặp theo thứ trong tuần, từ Thứ Hai đến Chủ nhật.',
      `Các bữa cần lập mỗi ngày: ${mealSections.filter((meal) => meals.includes(meal)).map((meal) => sectionLabels[meal].toLowerCase()).join(', ')}.`,
      avoided.length ? `Thực phẩm cần tránh đã lưu: ${avoided.join(', ')}.` : '',
      people ? `Số người ăn: ${people === 6 ? 'từ 6 người trở lên' : people}.` : '',
      minutes ? `Thời gian nấu tối đa mỗi bữa: ${minutes} phút.` : '',
      `Ưu tiên: ${priority.toLowerCase()}.`,
      all.length ? `Nguyên liệu đang có, hãy ưu tiên tận dụng khi phù hợp: ${all.map(ingredientLabel).join(', ')}.` : '',
      clean(note) ? `Yêu cầu bổ sung: ${note.trim()}` : '',
      'Hãy cho tôi xem đề xuất trước, tôi sẽ tự quyết định khi nào lưu thực đơn.',
    ].filter(Boolean).join('\n');
    if (prompt.length > 4000) { setSubmitError('Yêu cầu quá dài. Hãy rút ngắn ghi chú hoặc bớt nguyên liệu.'); return null; }
    setSubmitError('');
    return prompt;
  }

  const submit = () => {
    const prompt = buildPrompt();
    if (prompt) onSubmit(prompt);
  };
  const review = () => {
    const prompt = buildPrompt();
    if (prompt) onReview(prompt);
  };

  return (
    <View style={styles.root}>
      <ScrollView style={styles.root} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
        <Pressable accessibilityRole="button" onPress={onClose} hitSlop={8} style={styles.back}>
          <SymbolView name={{ ios: 'chevron.left', android: 'chevron_left', web: 'chevron_left' }} size={14} tintColor={theme.primary} />
          <Text style={[styles.backText, { color: theme.primary }]}>Quay lại trò chuyện</Text>
        </Pressable>
        <View style={styles.heading}>
          <Text style={[styles.title, { color: theme.foreground }]}>Lên thực đơn 7 ngày</Text>
          <Text style={[styles.subtitle, { color: theme.mutedForeground }]}>Chọn vài thông tin, trợ lý sẽ đề xuất thực đơn để bạn xem trước khi lưu.</Text>
        </View>

        <View style={[styles.avoidCard, { backgroundColor: theme.secondary, borderColor: theme.border }]}>
          <View style={styles.avoidCopy}>
            <Text style={[styles.avoidTitle, { color: theme.secondaryForeground }]}>Thực phẩm cần tránh</Text>
            {loading ? (
              <Text style={[styles.helper, { color: theme.mutedForeground }]}>Đang tải…</Text>
            ) : failed ? (
              <Pressable accessibilityRole="button" onPress={retry} hitSlop={6}>
                <Text style={[styles.error, { color: theme.destructive }]}>Không tải được hồ sơ ăn uống. Chạm để thử lại.</Text>
              </Pressable>
            ) : (
              <Text style={[styles.avoidText, { color: theme.foreground }]}>{avoided.length ? avoided.join(', ') : 'Chưa có'}</Text>
            )}
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Chỉnh sửa thực phẩm cần tránh"
            onPress={() => router.push('/dietary-profile')}
            hitSlop={8}
            style={({ pressed }) => [styles.avoidEdit, { backgroundColor: theme.card, opacity: pressed ? 0.7 : 1 }]}>
            <Text style={[styles.avoidEditText, { color: theme.primary }]}>Chỉnh sửa</Text>
          </Pressable>
        </View>

        <Field label="Các bữa mỗi ngày" error={noMeals ? 'Chọn ít nhất một bữa.' : ''}>
          <View style={styles.chipRow}>
            {mealSections.map((meal) => (
              <Chip key={meal} label={sectionLabels[meal]} role="checkbox" selected={meals.includes(meal)} onPress={() => toggleMeal(meal)} grow />
            ))}
          </View>
        </Field>

        <Field label="Số người ăn" hint="Không bắt buộc">
          <View style={styles.chipRow}>
            {PEOPLE_OPTIONS.map((count) => (
              <Chip key={count} label={count === 6 ? '6+' : String(count)} role="radio" selected={people === count} onPress={() => setPeople(people === count ? null : count)} grow compact />
            ))}
          </View>
        </Field>

        <Field label="Thời gian nấu tối đa mỗi bữa">
          <View style={styles.chipRow}>
            {MINUTE_OPTIONS.map((value) => (
              <Chip key={String(value)} label={value ? `${value} phút` : 'Không giới hạn'} role="radio" selected={minutes === value} onPress={() => setMinutes(value)} grow />
            ))}
          </View>
        </Field>

        <Field label="Ưu tiên">
          <View style={styles.chipRow}>
            {priorities.map((option) => (
              <Chip key={option} label={option} role="radio" selected={priority === option} onPress={() => setPriority(option)} />
            ))}
          </View>
        </Field>

        <Collapsible title="Nguyên liệu đang có" summary={ingredients.length ? `${ingredients.length} nguyên liệu` : 'Không bắt buộc'} open={pantryOpen} onToggle={() => setPantryOpen((open) => !open)}>
          <View style={styles.addRow}>
            <TextInput
              accessibilityLabel="Tên nguyên liệu"
              maxLength={80}
              value={editor.name}
              onChangeText={(name) => { setEditor((current) => ({ ...current, name })); setIngredientError(''); }}
              onSubmitEditing={addIngredient}
              returnKeyType="done"
              blurOnSubmit={false}
              placeholder="Gõ tên rồi bấm Thêm, ví dụ cà chua"
              placeholderTextColor={theme.mutedForeground}
              style={[styles.input, styles.addInput, { color: theme.foreground, borderColor: theme.border, backgroundColor: theme.card }]}
            />
            <Pressable accessibilityRole="button" accessibilityLabel="Thêm nguyên liệu" onPress={addIngredient} style={({ pressed }) => [styles.addButton, { backgroundColor: theme.primary, opacity: pressed ? 0.8 : 1 }]}>
              <Text style={[styles.addButtonText, { color: theme.primaryForeground }]}>Thêm</Text>
            </Pressable>
          </View>
          {detailOpen ? (
            <View style={styles.addRow}>
              <TextInput accessibilityLabel="Khối lượng nguyên liệu" keyboardType="decimal-pad" maxLength={16} value={editor.amount} onChangeText={(amount) => setEditor((current) => ({ ...current, amount }))} placeholder="Khối lượng" placeholderTextColor={theme.mutedForeground} style={[styles.input, styles.half, { color: theme.foreground, borderColor: theme.border, backgroundColor: theme.card }]} />
              <TextInput accessibilityLabel="Đơn vị nguyên liệu" maxLength={20} value={editor.unit} onChangeText={(unit) => setEditor((current) => ({ ...current, unit }))} placeholder="Đơn vị, ví dụ g" placeholderTextColor={theme.mutedForeground} style={[styles.input, styles.half, { color: theme.foreground, borderColor: theme.border, backgroundColor: theme.card }]} />
            </View>
          ) : (
            <Pressable accessibilityRole="button" onPress={() => setDetailOpen(true)} hitSlop={6} style={styles.linkButton}>
              <Text style={[styles.linkText, { color: theme.primary }]}>＋ Thêm khối lượng, đơn vị</Text>
            </Pressable>
          )}
          {ingredientError ? <Text accessibilityRole="alert" style={[styles.error, { color: theme.destructive }]}>{ingredientError}</Text> : null}
          {ingredients.length ? (
            <View style={styles.chipRow}>
              {ingredients.map((item) => (
                <View key={item.id} style={[styles.tag, { backgroundColor: theme.secondary, borderColor: theme.border }]}>
                  <Text style={[styles.tagText, { color: theme.foreground }]} numberOfLines={1}>{ingredientLabel(item)}</Text>
                  <Pressable accessibilityRole="button" accessibilityLabel={`Xóa ${item.name}`} hitSlop={8} onPress={() => setIngredients((current) => current.filter((entry) => entry.id !== item.id))}>
                    <SymbolView name={{ ios: 'xmark', android: 'close', web: 'close' }} size={12} tintColor={theme.mutedForeground} />
                  </Pressable>
                </View>
              ))}
            </View>
          ) : null}
        </Collapsible>

        <Collapsible title="Yêu cầu thêm" summary={clean(note) ? 'Đã nhập' : 'Không bắt buộc'} open={noteOpen} onToggle={() => setNoteOpen((open) => !open)}>
          <TextInput
            accessibilityLabel="Yêu cầu thêm cho thực đơn"
            multiline
            maxLength={2500}
            value={note}
            onChangeText={setNote}
            placeholder="Ví dụ: bữa tối nhẹ, ít dầu, không lặp món…"
            placeholderTextColor={theme.mutedForeground}
            textAlignVertical="top"
            style={[styles.input, styles.note, { color: theme.foreground, borderColor: theme.border, backgroundColor: theme.card }]}
          />
        </Collapsible>
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: theme.card, borderTopColor: theme.border }]}>
        <View style={styles.footerInner}>
          {submitError ? <Text accessibilityRole="alert" style={[styles.error, styles.footerError, { color: theme.destructive }]}>{submitError}</Text> : null}
          <Text style={[styles.confirm, { color: theme.mutedForeground }]}>
            Khi gửi, bạn xác nhận đã kiểm tra thực phẩm cần tránh ở trên.
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: !canSubmit }}
            disabled={!canSubmit}
            onPress={submit}
            style={({ pressed }) => [styles.submit, { backgroundColor: theme.primary, opacity: !canSubmit ? 0.5 : pressed ? 0.85 : 1 }]}>
            <Text style={[styles.submitText, { color: theme.primaryForeground }]}>{busy ? 'Trợ lý đang trả lời…' : 'Xác nhận và gửi'}</Text>
          </Pressable>
          <Pressable accessibilityRole="button" disabled={!canSubmit} onPress={review} hitSlop={6} style={styles.reviewButton}>
            <Text style={[styles.linkText, { color: canSubmit ? theme.primary : theme.mutedForeground }]}>Xem lại nội dung trước khi gửi</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function Field({ label, hint, error, children }: { label: string; hint?: string; error?: string; children: ReactNode }) {
  const theme = useTheme();
  return (
    <View style={styles.field}>
      <View style={styles.labelRow}>
        <Text style={[styles.label, { color: theme.foreground }]}>{label}</Text>
        {hint ? <Text style={[styles.helper, { color: theme.mutedForeground }]}>{hint}</Text> : null}
      </View>
      {children}
      {error ? <Text accessibilityRole="alert" style={[styles.error, { color: theme.destructive }]}>{error}</Text> : null}
    </View>
  );
}

function Chip({ label, selected, onPress, role, grow, compact }: { label: string; selected: boolean; onPress: () => void; role: 'checkbox' | 'radio'; grow?: boolean; compact?: boolean }) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole={role}
      accessibilityState={role === 'checkbox' ? { checked: selected } : { selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        grow && styles.chipGrow,
        compact && styles.chipCompact,
        { borderColor: selected ? theme.primary : theme.border, backgroundColor: selected ? theme.secondary : theme.card, opacity: pressed ? 0.8 : 1 },
      ]}>
      {role === 'checkbox' && selected ? <SymbolView name={{ ios: 'checkmark', android: 'check', web: 'check' }} size={13} tintColor={theme.primary} /> : null}
      <Text style={[styles.chipText, { color: selected ? theme.primary : theme.foreground, fontFamily: selected ? Fonts.sansBold : Fonts.sansMedium }]}>{label}</Text>
    </Pressable>
  );
}

function Collapsible({ title, summary, open, onToggle, children }: { title: string; summary: string; open: boolean; onToggle: () => void; children: ReactNode }) {
  const theme = useTheme();
  return (
    <View style={[styles.collapsible, { borderColor: theme.border, backgroundColor: theme.card }]}>
      <Pressable accessibilityRole="button" accessibilityState={{ expanded: open }} onPress={onToggle} style={styles.collapsibleHeader}>
        <View style={styles.collapsibleCopy}>
          <Text style={[styles.label, { color: theme.foreground }]}>{title}</Text>
          <Text style={[styles.helper, { color: theme.mutedForeground }]}>{summary}</Text>
        </View>
        <SymbolView name={open ? { ios: 'chevron.up', android: 'expand_less', web: 'expand_less' } : { ios: 'chevron.down', android: 'expand_more', web: 'expand_more' }} size={16} tintColor={theme.mutedForeground} />
      </Pressable>
      {open ? <View style={styles.collapsibleBody}>{children}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { width: '100%', maxWidth: 680, alignSelf: 'center', padding: Spacing.three, paddingBottom: Spacing.four, gap: Spacing.three },
  back: { alignSelf: 'flex-start', minHeight: 32, flexDirection: 'row', alignItems: 'center', gap: Spacing.one },
  backText: { fontFamily: Fonts.sansBold, fontSize: 13, lineHeight: 18 },
  heading: { gap: Spacing.one },
  title: { fontFamily: Fonts.headingBold, fontSize: 21, lineHeight: 29 },
  subtitle: { fontFamily: Fonts.sans, fontSize: 14, lineHeight: 20 },

  avoidCard: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, borderWidth: 1, borderRadius: Radius['2xl'], padding: Spacing.three },
  avoidCopy: { flex: 1, minWidth: 0, gap: Spacing.one },
  avoidTitle: { fontFamily: Fonts.sansBold, fontSize: 13, lineHeight: 18 },
  avoidText: { fontFamily: Fonts.sans, fontSize: 14, lineHeight: 20 },
  avoidEdit: { minHeight: 36, justifyContent: 'center', borderRadius: Radius['4xl'], paddingHorizontal: Spacing.three },
  avoidEditText: { fontFamily: Fonts.sansBold, fontSize: 13, lineHeight: 18 },

  field: { gap: Spacing.two },
  labelRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: Spacing.two },
  label: { fontFamily: Fonts.sansSemibold, fontSize: 14, lineHeight: 20 },
  helper: { fontFamily: Fonts.sans, fontSize: 12, lineHeight: 18 },
  error: { fontFamily: Fonts.sansMedium, fontSize: 13, lineHeight: 19 },

  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  chip: { minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.one + Spacing.half, borderWidth: 1, borderRadius: Radius.xl, paddingHorizontal: Spacing.three },
  chipGrow: { flexGrow: 1 },
  chipCompact: { minWidth: 44, paddingHorizontal: Spacing.two },
  chipText: { fontSize: 14, lineHeight: 20 },

  collapsible: { borderWidth: 1, borderRadius: Radius['2xl'] },
  collapsibleHeader: { minHeight: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.two, paddingHorizontal: Spacing.three, paddingVertical: Spacing.two },
  collapsibleCopy: { flex: 1, minWidth: 0 },
  collapsibleBody: { gap: Spacing.two + Spacing.one, paddingHorizontal: Spacing.three, paddingBottom: Spacing.three },

  addRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  input: { minHeight: 44, borderWidth: 1, borderRadius: Radius.xl, paddingHorizontal: Spacing.three, fontFamily: Fonts.sans, fontSize: 14 },
  addInput: { flex: 1, minWidth: 0 },
  half: { flex: 1, minWidth: 0 },
  addButton: { minHeight: 44, minWidth: 64, alignItems: 'center', justifyContent: 'center', borderRadius: Radius.xl, paddingHorizontal: Spacing.three },
  addButtonText: { fontFamily: Fonts.sansBold, fontSize: 14, lineHeight: 20 },
  linkButton: { alignSelf: 'flex-start', minHeight: 28, justifyContent: 'center' },
  linkText: { fontFamily: Fonts.sansSemibold, fontSize: 13, lineHeight: 18 },
  tag: { maxWidth: '100%', minHeight: 36, flexDirection: 'row', alignItems: 'center', gap: Spacing.two, borderWidth: 1, borderRadius: Radius['4xl'], paddingLeft: Spacing.three, paddingRight: Spacing.two + Spacing.one },
  tagText: { flexShrink: 1, fontFamily: Fonts.sansMedium, fontSize: 13, lineHeight: 18 },
  note: { minHeight: 96, paddingVertical: Spacing.two + Spacing.one, lineHeight: 20 },

  footer: { borderTopWidth: StyleSheet.hairlineWidth, paddingHorizontal: Spacing.three, paddingTop: Spacing.two + Spacing.one, paddingBottom: Spacing.two + Spacing.one },
  footerInner: { width: '100%', maxWidth: 680, alignSelf: 'center', gap: Spacing.two },
  footerError: { textAlign: 'center' },
  confirm: { textAlign: 'center', fontFamily: Fonts.sans, fontSize: 12, lineHeight: 17 },
  submit: { minHeight: 48, alignItems: 'center', justifyContent: 'center', borderRadius: Radius.xl, paddingHorizontal: Spacing.three },
  submitText: { fontFamily: Fonts.sansBold, fontSize: 15, lineHeight: 21 },
  reviewButton: { alignSelf: 'center', minHeight: 32, justifyContent: 'center' },
});
