import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native';
import { SymbolView } from 'expo-symbols';

import { useRecipes } from '@/features/recipes/hooks/use-recipes';
import { useTheme } from '@/hooks/use-theme';

import type { MealPlanner } from '../hooks/meal-planner-provider';
import { MAX_DISHES } from '../types/meal-edit.schema';
import { mealSections } from '../types/meal-plan.schema';
import { slotIds, type Slot } from '../utils/meal-edit';
import { dayLabels, sectionLabels } from '../utils/meal-plan';
import { ActionButton, ActionText, actionStyles as styles, MealActionSheet } from './meal-action-sheet';
import { MealSelectField } from './meal-select-field';

export type MealSelection = Slot & { recipe?: { id: string; title: string }; action?: 'move' | 'remove' };
export function MealEditSheet({ planner, selection, onClose }: { planner: MealPlanner; selection: MealSelection; onClose: () => void }) {
  const theme = useTheme();
  const [query, setQuery] = useState('');
  const [search, setSearch] = useState('');
  const [moving, setMoving] = useState(selection.action === 'move');
  const [destination, setDestination] = useState<Slot>({ day: selection.day, section: selection.section });
  const [confirmRemove, setConfirmRemove] = useState(selection.action === 'remove');
  useEffect(() => { const timer = setTimeout(() => setSearch(query.trim()), 300); return () => clearTimeout(timer); }, [query]);
  const options = useRecipes({ q: search, suitableForMe: true }, !selection.recipe);
  const { mealActions: actions, plan } = planner;
  const busy = planner.busy;
  const currentIds = plan.data ? slotIds(plan.data, selection) : [];
  const canEdit = !!plan.data?.editable && !!plan.data.days.find(({ day }) => day === selection.day)?.editable;
  const destinationIds = plan.data ? slotIds(plan.data, destination) : [];
  const canMove = !!selection.recipe && (destination.day !== selection.day || destination.section !== selection.section) && !destinationIds.includes(selection.recipe.id) && destinationIds.length < MAX_DISHES;
  async function remove() { if (selection.recipe && await actions.edit({ kind: 'remove', slot: selection, recipeId: selection.recipe.id })) onClose(); }
  return <MealActionSheet title={selection.recipe?.title ?? 'Thêm món vào thực đơn'} subtitle={`${dayLabels[selection.day]} · ${sectionLabels[selection.section]}`} onClose={onClose} busy={busy}>
    {!canEdit ? <ActionText error>Ngày này chỉ có thể xem lại.</ActionText> : selection.recipe ? <>
      <View style={styles.row}>
        <View style={{ flex: 1 }}><ActionButton label="Chuyển món" icon={<SymbolView name={{ ios: 'arrow.up.and.down.and.arrow.left.and.right', android: 'open_with', web: 'open_with' }} size={17} tintColor={theme.primary} />} selected={moving} disabled={busy} onPress={() => { setMoving(true); setConfirmRemove(false); }} /></View>
        <View style={{ flex: 1 }}><ActionButton label="Gỡ món" icon={<SymbolView name={{ ios: 'trash', android: 'delete_outline', web: 'delete_outline' }} size={17} tintColor={theme.destructive} />} destructive disabled={busy} onPress={() => { setConfirmRemove(true); setMoving(false); }} /></View>
      </View>
      {confirmRemove ? <View style={styles.group}><ActionText>Gỡ {selection.recipe.title} khỏi bữa này?</ActionText><View style={styles.row}><View style={{ flex: 1 }}><ActionButton label="Xác nhận gỡ món" destructive disabled={busy} onPress={() => void remove()} /></View><View style={{ flex: 1 }}><ActionButton label="Giữ món" disabled={busy} onPress={() => setConfirmRemove(false)} /></View></View></View> : null}
      {moving ? <>
        <MealSelectField label="Chuyển đến ngày" values={[destination.day]} options={plan.data?.days.filter(({ editable }) => editable).map(({ day, date }) => ({ value: day, label: dayLabels[day], description: date.split('-').reverse().join('/') })) ?? []} disabled={busy} onChange={([day]) => setDestination({ ...destination, day })} />
        <MealSelectField label="Chuyển đến bữa" values={[destination.section]} options={mealSections.map((section) => ({ value: section, label: sectionLabels[section] }))} disabled={busy} onChange={([section]) => setDestination({ ...destination, section })} />
        {destinationIds.length >= MAX_DISHES ? <ActionText error>Bữa này đã đủ {MAX_DISHES} món.</ActionText> : selection.recipe && destinationIds.includes(selection.recipe.id) && (destination.day !== selection.day || destination.section !== selection.section) ? <ActionText error>Món đã có trong bữa này.</ActionText> : null}
        <ActionButton label={busy ? 'Đang lưu…' : 'Xác nhận chuyển món'} primary disabled={busy || !canMove} onPress={() => { if (selection.recipe) void actions.edit({ kind: 'move', slot: selection, to: destination, recipeId: selection.recipe.id }).then((ok) => { if (ok) onClose(); }); }} />
      </> : null}
    </> : <>
      <TextInput accessibilityLabel="Tìm món để thêm" value={query} onChangeText={setQuery} maxLength={100} placeholder="Tìm tên món hoặc nguyên liệu…" placeholderTextColor={theme.mutedForeground} style={[styles.input, { color: theme.foreground, borderColor: theme.border }]} />
      <ActionText>Các món được lọc theo hồ sơ ăn uống của bạn · Tối đa {MAX_DISHES} món/bữa.</ActionText>
      {options.isPending ? <ActivityIndicator color={theme.primary} /> : options.isError ? <ActionButton label="Chưa tải được món · Thử lại" onPress={() => void options.refetch()} /> : null}
      {options.data?.pages.flatMap(({ items }) => items).map((recipe) => <Pressable key={recipe.id} accessibilityRole="button" accessibilityLabel={`Thêm ${recipe.title}`} disabled={busy || currentIds.includes(recipe.id) || currentIds.length >= MAX_DISHES || search !== query.trim()} onPress={() => void actions.edit({ kind: 'add', slot: selection, recipeId: recipe.id }).then((ok) => { if (ok) onClose(); })} style={[styles.input, { borderColor: theme.border, backgroundColor: theme.card, opacity: busy || currentIds.includes(recipe.id) || currentIds.length >= MAX_DISHES ? 0.45 : 1 }]}><Text style={[styles.title, { color: theme.foreground }]}>{recipe.title}</Text><ActionText>{currentIds.includes(recipe.id) ? 'Đã có trong bữa' : `${recipe.totalMinutes ?? (recipe.prepMinutes ?? 0) + (recipe.cookMinutes ?? 0)} phút · ${recipe.servings} khẩu phần · Thêm +`}</ActionText></Pressable>)}
      {options.data?.pages.every(({ items }) => !items.length) ? <ActionText>Chưa tìm thấy món phù hợp. Thử từ khóa khác.</ActionText> : null}
      {options.hasNextPage ? <ActionButton label={options.isFetchingNextPage ? 'Đang tải…' : 'Xem thêm món'} disabled={options.isFetchingNextPage || busy} onPress={() => void options.fetchNextPage()} /> : null}
    </>}
    {busy ? <ActivityIndicator accessibilityLabel="Đang lưu thực đơn" color={theme.primary} /> : null}
    {actions.error ? <ActionText error>{actions.error}</ActionText> : null}
  </MealActionSheet>;
}
