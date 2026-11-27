import { useEffect, useState } from 'react';
import * as Clipboard from 'expo-clipboard';
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { SymbolView } from 'expo-symbols';

import { Fonts, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useSessionStore } from '@/shared/stores/session-store';

import { useMealPlan } from '../hooks/use-meal-plan';
import { useShoppingList, type ShoppingCommand } from '../hooks/use-shopping-list';
import type { Weekday } from '../types/meal-plan.schema';
import { dayLabels, sectionLabels } from '../utils/meal-plan';
import { itemAmount, shoppingItemKey, shoppingText } from '../utils/shopping-list';
import { ActionButton, ActionText, actionStyles as styles } from './meal-action-sheet';
import { MealSelectField } from './meal-select-field';

export type ShoppingSnapshot = { shoppingDays: Weekday[]; shoppingPeople: number; shoppingCheckedCount: number };
export function ShoppingListPanel({ weekStart, command, onSnapshot, onContext, onRecipe }: { weekStart: string; command?: ShoppingCommand; onSnapshot?: (snapshot: ShoppingSnapshot) => void; onContext?: (text: string) => void; onRecipe?: (id: string, title: string) => void }) {
  const theme = useTheme();
  const token = useSessionStore((state) => state.actor ? null : state.accessToken);
  const plan = useMealPlan(token, weekStart);
  const [selection, setSelection] = useState<{ command?: ShoppingCommand; days: 'ALL' | Weekday[] }>({ command, days: command?.day && !command.wholeWeek ? [command.day] : 'ALL' });
  const chosen = command !== selection.command && (command?.day || command?.wholeWeek) ? command.wholeWeek ? 'ALL' : [command.day!] : selection.days;
  const eligible = plan.data?.days.filter(({ editable }) => editable).map(({ day }) => day) ?? [];
  const days = eligible.filter((day) => chosen === 'ALL' || chosen.includes(day));
  const { data, preferences, ready, storageError, setPeople, toggle, clear } = useShoppingList(weekStart, days, command);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [copyNotice, setCopyNotice] = useState('');
  const visible = data.data?.items ?? [];
  const checkedCount = visible.filter((item) => preferences.checked.includes(shoppingItemKey(item))).length;
  const snapshot = JSON.stringify({ shoppingDays: days, shoppingPeople: preferences.people, shoppingCheckedCount: checkedCount });
  const context = data.data && !data.isFetching && !data.isError && ready ? shoppingText(data.data, preferences.people, preferences.checked) : '';
  useEffect(() => { if (ready) onSnapshot?.(JSON.parse(snapshot)); }, [onSnapshot, ready, snapshot]);
  useEffect(() => { if (context) onContext?.(context); }, [context, onContext]);
  function choose(selected: Weekday[]) {
    setSelection({ command, days: selected.length === eligible.length ? 'ALL' : selected });
  }
  async function copy() {
    if (!data.data) return;
    try { await Clipboard.setStringAsync(shoppingText(data.data, preferences.people, preferences.checked)); setCopyNotice('Đã sao chép danh sách.'); }
    catch { setCopyNotice('Chưa sao chép được. Hãy thử lại.'); }
  }
  return <View style={localStyles.panel}>
    <View style={[localStyles.intro, { backgroundColor: theme.secondary }]}><View style={{ flex: 1, gap: 6 }}><Text accessibilityRole="header" style={[localStyles.heading, { color: theme.foreground }]}>Giỏ đi chợ của bạn</Text><ActionText>Đủ nguyên liệu, sẵn sàng cho bữa ngon.</ActionText></View><Image source={require('@/assets/branding/carrot-sticker.png')} style={{ width: 76, height: 84 }} resizeMode="contain" accessible={false} /></View>
    {plan.isPending ? <ActivityIndicator color={theme.primary} /> : plan.isError ? <ActionButton label="Chưa tải được tuần · Thử lại" onPress={() => void plan.refetch()} /> : null}
    <View style={[localStyles.filters, { borderColor: theme.border, backgroundColor: theme.card }]}>
      <MealSelectField label="Ngày đi chợ" values={days} multiple placeholder="Chọn ngày cần mua nguyên liệu" summary={chosen === 'ALL' && days.length ? `Cả tuần · ${days.length} ngày còn lại` : undefined} options={plan.data?.days.map(({ day, date, editable }) => ({ value: day, label: dayLabels[day], description: `${date.split('-').reverse().join('/')}${editable ? '' : ' · Ngày đã qua'}`, disabled: !editable })) ?? []} disabled={!eligible.length} onChange={choose} />
      <MealSelectField label="Số người ăn" values={[String(preferences.people)]} options={[1, 2, 3, 4].map((people) => ({ value: String(people), label: `${people} người` }))} disabled={!ready} onChange={([people]) => setPeople(Number(people))} />
      <ActionText>Lượng nguyên liệu được quy đổi theo khẩu phần của từng công thức.</ActionText>
    </View>
    {!days.length ? <ActionText>{eligible.length ? 'Chọn ít nhất một ngày để xem nguyên liệu.' : 'Các ngày của tuần này đã qua. Danh sách đi chợ chỉ tính từ hôm nay.'}</ActionText> : data.isPending ? <ActivityIndicator color={theme.primary} /> : data.isError ? <ActionButton label="Chưa tải được danh sách · Thử lại" onPress={() => void data.refetch()} /> : <>
      <View style={styles.group}>
        <View style={localStyles.progressHeading}><Text accessibilityRole="header" style={[styles.title, { color: theme.foreground }]}>Nguyên liệu cần mua</Text><View style={[localStyles.badge, { backgroundColor: theme.secondary }]}><Text style={[localStyles.smallLabel, { color: theme.primary }]}>{checkedCount}/{visible.length}</Text></View></View>
        <View accessibilityRole="progressbar" accessibilityLabel="Tiến độ mua nguyên liệu" accessibilityValue={{ min: 0, max: visible.length || 1, now: checkedCount }} style={[localStyles.progress, { backgroundColor: theme.muted }]}><View style={{ height: '100%', width: `${visible.length ? checkedCount / visible.length * 100 : 0}%`, backgroundColor: theme.primary, borderRadius: 4 }} /></View>
        <ActionText>{checkedCount} nguyên liệu đã mua · Chạm để đánh dấu</ActionText>
      </View>
      {data.isFetching ? <ActivityIndicator color={theme.primary} /> : null}
      {visible.map((item) => {
        const key = shoppingItemKey(item), checked = preferences.checked.includes(key);
        return <View key={key} style={[localStyles.item, { borderColor: checked ? theme.primary + '60' : theme.border, backgroundColor: checked ? theme.secondary : theme.card }]}>
          <View style={localStyles.itemRow}><Pressable accessibilityRole="checkbox" accessibilityLabel={`Đã mua ${item.name}${item.unit ? ` (${item.unit})` : ''}`} accessibilityState={{ checked, disabled: !ready || data.isFetching }} disabled={!ready || data.isFetching} onPress={() => toggle(key)} style={({ pressed }) => [localStyles.checkRow, { opacity: !ready || data.isFetching ? 0.5 : pressed ? 0.7 : 1 }]}><View style={[localStyles.check, { borderColor: checked ? theme.primary : theme.border, backgroundColor: checked ? theme.primary : theme.card }]}>{checked ? <SymbolView name={{ ios: 'checkmark', android: 'check', web: 'check' }} size={16} tintColor={theme.primaryForeground} /> : null}</View><View style={{ flex: 1, gap: 3 }}><Text style={[styles.title, { color: checked ? theme.mutedForeground : theme.foreground, textDecorationLine: checked ? 'line-through' : 'none' }]}>{item.name}</Text><ActionText>{itemAmount(item, preferences.people)}</ActionText></View></Pressable><Pressable accessibilityRole="button" accessibilityLabel={`Xem món dùng ${item.name}`} accessibilityState={{ expanded: expanded === key }} onPress={() => setExpanded(expanded === key ? null : key)} style={[localStyles.expand, { backgroundColor: theme.muted }]}><SymbolView name={{ ios: expanded === key ? 'chevron.up' : 'chevron.down', android: expanded === key ? 'expand_less' : 'expand_more', web: expanded === key ? 'expand_less' : 'expand_more' }} size={20} tintColor={theme.primary} /></Pressable></View>
          {expanded === key ? <View style={[localStyles.sources, { borderTopColor: theme.border }]}>{item.contributions.map((source, index) => <View key={`${source.recipeId}-${source.day}-${source.section}-${index}`} style={styles.group}><ActionText>{dayLabels[source.day]} · {sectionLabels[source.section]}{source.note ? ` — ${source.note}` : ''}</ActionText>{onRecipe ? <ActionButton label={`${source.recipeTitle} · Xem công thức ↗`} onPress={() => onRecipe(source.recipeId, source.recipeTitle)} /> : <ActionText>{source.recipeTitle}</ActionText>}</View>)}</View> : null}
        </View>;
      })}
      {!visible.length ? <ActionText>Chưa có nguyên liệu. Thêm món vào các ngày đã chọn để tạo danh sách đi chợ.</ActionText> : <View style={styles.group}><ActionButton label="Sao chép danh sách" primary disabled={!ready || data.isFetching} onPress={() => void copy()} /><ActionButton label="Bỏ dấu đã mua" disabled={!ready || !preferences.checked.length} onPress={clear} /><ActionText>Dấu đã mua được lưu trên thiết bị cho tuần này.</ActionText></View>}
    </>}
    {storageError ? <ActionText error>{storageError}</ActionText> : null}
    {copyNotice ? <ActionText>{copyNotice}</ActionText> : null}
  </View>;
}

const localStyles = StyleSheet.create({
  panel: { gap: Spacing.four },
  intro: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, padding: Spacing.four, borderRadius: Radius['2xl'] },
  heading: { fontFamily: Fonts.headingBold, fontSize: 20, lineHeight: 30 },
  filters: { padding: Spacing.three, borderRadius: Radius['2xl'], borderWidth: 1, gap: Spacing.four },
  progressHeading: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: Spacing.two, justifyContent: 'space-between' },
  badge: { borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5 },
  smallLabel: { fontFamily: Fonts.sansSemibold, fontSize: 13 },
  progress: { height: 6, borderRadius: 4, overflow: 'hidden' },
  item: { borderWidth: 1, borderRadius: Radius['2xl'], padding: Spacing.three },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  checkRow: { flex: 1, minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  check: { width: 26, height: 26, borderRadius: 9, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  expand: { minHeight: 44, width: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  sources: { marginTop: Spacing.three, paddingTop: Spacing.three, borderTopWidth: StyleSheet.hairlineWidth, gap: Spacing.three },
});
