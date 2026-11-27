import { useState } from 'react';
import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Fonts, Radius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { ActionButton, ActionText } from '@/features/meal-plan/components/meal-action-sheet';
import type { MealLogEntry, MealLogEntryUpdate } from '../types/meal-log.schema';
import { caloriesLabel, mealLogEdit, mealLogErrorMessage, vn } from '../utils/meal-log';

export function MealLogEntryRow({ entry, editable, busy, onUpdate, onDelete }: { entry: MealLogEntry; editable: boolean; busy: boolean; onUpdate: (change: MealLogEntryUpdate) => Promise<unknown>; onDelete: () => void }) {
  const theme = useTheme();
  const [editing, setEditing] = useState(false);
  const [servings, setServings] = useState(String(entry.servings));
  const [calories, setCalories] = useState(entry.caloriesPerServing === null ? '' : String(entry.caloriesPerServing));
  const [error, setError] = useState('');
  async function save() {
    let change: MealLogEntryUpdate;
    try { change = mealLogEdit(entry, servings, calories); } catch (caught) { setError((caught as Error).message); return; }
    setError('');
    try {
      if (Object.keys(change).length) await onUpdate(change);
      setEditing(false);
    } catch (caught) { setError(mealLogErrorMessage(caught)); }
  }
  function cancel() {
    setServings(String(entry.servings));
    setCalories(entry.caloriesPerServing === null ? '' : String(entry.caloriesPerServing));
    setError('');
    setEditing(false);
  }
  const input = [styles.input, { color: theme.foreground, borderColor: theme.border, backgroundColor: theme.background }];
  return <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
    <View style={styles.row}>
      <View style={styles.flex}><Text style={[styles.name, { color: theme.foreground }]}>{entry.name}</Text><Text style={[styles.text, { color: theme.mutedForeground }]}>{vn(entry.servings)} khẩu phần · {caloriesLabel(entry)}{entry.calorieSource === 'WEB_ESTIMATE' ? ' · AI ước tính' : ''}</Text></View>
      {editable && !editing ? <View style={styles.row}>
        <Pressable accessibilityRole="button" accessibilityLabel={`Sửa ${entry.name}`} disabled={busy} onPress={() => setEditing(true)} style={[styles.icon, { backgroundColor: theme.secondary, opacity: busy ? 0.4 : 1 }]}><SymbolView name={{ ios: 'pencil', android: 'edit', web: 'edit' }} size={18} tintColor={theme.primary} /></Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel={`Xóa ${entry.name}`} disabled={busy} onPress={onDelete} style={[styles.icon, { backgroundColor: theme.muted, opacity: busy ? 0.4 : 1 }]}><SymbolView name={{ ios: 'trash', android: 'delete', web: 'delete' }} size={18} tintColor={theme.destructive} /></Pressable>
      </View> : null}
    </View>
    {editing && editable ? <View style={styles.form}>
      <View style={styles.fields}>
        <View style={styles.field}><Text style={[styles.text, { color: theme.foreground }]}>Khẩu phần</Text><TextInput accessibilityLabel={`Khẩu phần của ${entry.name}`} value={servings} onChangeText={setServings} keyboardType="decimal-pad" maxLength={8} editable={!busy} style={input} /></View>
        <View style={styles.field}><Text style={[styles.text, { color: theme.foreground }]}>Kcal mỗi suất</Text><TextInput accessibilityLabel={`Kcal mỗi suất của ${entry.name}`} value={calories} onChangeText={setCalories} keyboardType="number-pad" maxLength={8} editable={!busy} placeholder="Chưa biết" placeholderTextColor={theme.mutedForeground} style={input} /></View>
      </View>
      <ActionText>Để trống kcal nếu chưa biết. Chỉ sửa khẩu phần sẽ giữ nguyên nguồn kcal hiện tại.</ActionText>
      {error ? <ActionText error>{error}</ActionText> : null}
      <View style={styles.row}><View style={styles.flex}><ActionButton label="Hủy" disabled={busy} onPress={cancel} /></View><View style={styles.flex}><ActionButton label={busy ? 'Đang lưu…' : 'Lưu thay đổi'} primary disabled={busy} onPress={() => void save()} /></View></View>
    </View> : null}
  </View>;
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: Radius.xl, padding: 12, gap: 12 }, row: { flexDirection: 'row', alignItems: 'center', gap: 6 }, flex: { flex: 1, minWidth: 0 },
  name: { fontFamily: Fonts.sansSemibold, fontSize: 15, lineHeight: 22 }, text: { fontFamily: Fonts.sans, fontSize: 13, lineHeight: 20 },
  icon: { width: 44, height: 44, borderRadius: Radius.xl, alignItems: 'center', justifyContent: 'center' },
  form: { gap: 10 }, fields: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 }, field: { flex: 1, minWidth: 110, gap: 5 },
  input: { minHeight: 46, borderWidth: 1, borderRadius: Radius.lg, padding: 10, fontFamily: Fonts.sans, fontSize: 16 },
});
