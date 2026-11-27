import { useState } from 'react';
import { ActivityIndicator, Image, StyleSheet, Text, TextInput, View } from 'react-native';

import { Fonts, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import type { MealPlanner } from '../hooks/meal-planner-provider';
import { mealSections, type MealSection } from '../types/meal-plan.schema';
import { sectionLabels } from '../utils/meal-plan';
import { ActionButton, ActionText, actionStyles as styles, MealActionSheet } from './meal-action-sheet';
import { MealSelectField } from './meal-select-field';

export function QuickGenerateSheet({ planner, onClose }: { planner: MealPlanner; onClose: () => void }) {
  const theme = useTheme();
  const [scope, setScope] = useState<'EMPTY' | 'WEEK' | 'TODAY'>('EMPTY');
  const [sections, setSections] = useState<MealSection[]>(['BREAKFAST', 'LUNCH', 'DINNER']);
  const [minutes, setMinutes] = useState<number | undefined>();
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');
  const plan = planner.plan.data;
  const busy = planner.busy;
  const hasToday = plan?.days.some((day) => day.date === plan.today && day.editable);
  const activeScope = scope === 'TODAY' && !hasToday ? 'EMPTY' : scope;
  const days = plan?.days.filter((day) => day.editable && (activeScope !== 'TODAY' || day.date === plan.today)) ?? [];
  const slotCount = days.reduce((count, day) => count + day.sections.filter(({ section, recipes }) => sections.includes(section) && (activeScope !== 'EMPTY' || !recipes.length)).length, 0);
  async function submit() {
    if (!plan || busy) return;
    if (!sections.length) { setError('Chọn ít nhất một bữa.'); return; }
    if (!days.length) { setError('Các ngày của tuần này đã qua nên không thể lên thực đơn.'); return; }
    setError('');
    if (await planner.mealActions.generate({ weekStart: plan.weekStart, days: days.map(({ day }) => day), sections, onlyEmpty: activeScope === 'EMPTY', ...(minutes ? { maxMinutes: minutes } : {}), ...(query.trim() ? { query: query.trim() } : {}) })) onClose();
  }
  return <MealActionSheet title="Lên món nhanh" subtitle="Bữa ngon theo sở thích, không tốn lượt AI." onClose={onClose} busy={busy} footer={<>
    {error || planner.mealActions.error ? <ActionText error>{error || planner.mealActions.error}</ActionText> : null}
    {!sections.length ? <ActionText error>Chọn ít nhất một bữa để tiếp tục.</ActionText> : null}
    {busy ? <ActivityIndicator accessibilityLabel="Đang lên món" color={theme.primary} /> : null}
    <ActionButton label={busy ? 'Đang lên và lưu món…' : 'Lên món và lưu thực đơn'} primary disabled={busy || !plan?.editable || !sections.length} onPress={() => void submit()} />
  </>}>
    <View style={[localStyles.intro, { backgroundColor: theme.secondary }]}>
      <View style={{ flex: 1, gap: 6 }}><Text style={[localStyles.introTitle, { color: theme.foreground }]}>Hôm nay ăn gì, để Vedora gợi ý.</Text><ActionText>Chọn vài sở thích, thực đơn sẵn sàng.</ActionText></View>
      <Image source={require('@/assets/branding/carrot-sticker.png')} style={localStyles.sticker} resizeMode="contain" accessible={false} />
    </View>
    <View style={[localStyles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <MealSelectField label="Phạm vi lên món" values={[activeScope]} options={[
        { value: 'EMPTY' as const, label: 'Các bữa trống', description: 'Giữ nguyên những bữa đã có món' },
        { value: 'WEEK' as const, label: 'Cả tuần', description: 'Lên lại các bữa đã chọn từ hôm nay' },
        ...(hasToday ? [{ value: 'TODAY' as const, label: 'Hôm nay', description: 'Chỉ lên món cho ngày hôm nay' }] : []),
      ]} disabled={busy} onChange={([value]) => { setScope(value); setError(''); }} />
      <MealSelectField label="Bữa ăn" values={sections} options={mealSections.map((section) => ({ value: section, label: sectionLabels[section] }))} multiple placeholder="Chọn bữa muốn lên món" disabled={busy} onChange={(values) => { setSections(values); setError(''); }} />
      <MealSelectField label="Thời gian nấu tối đa" values={[minutes ? String(minutes) : 'ANY']} options={[
        { value: 'ANY', label: 'Không giới hạn' }, ...[15, 30, 60].map((value) => ({ value: String(value), label: `${value} phút` })),
      ]} disabled={busy} onChange={([value]) => setMinutes(value === 'ANY' ? undefined : Number(value))} />
    </View>
    <View style={styles.group}><Text style={[localStyles.label, { color: theme.foreground }]}>Ưu tiên món hoặc nguyên liệu</Text><TextInput accessibilityLabel="Ưu tiên món khi lên nhanh" editable={!busy} value={query} onChangeText={setQuery} maxLength={100} placeholder="Ví dụ: món Việt, nấm, đậu hũ…" placeholderTextColor={theme.mutedForeground} style={[styles.input, { color: theme.foreground, backgroundColor: theme.card, borderColor: theme.border }]} /><ActionText>Không bắt buộc · Tối đa 100 ký tự.</ActionText></View>
    <View style={[localStyles.summary, { borderColor: theme.border, backgroundColor: theme.muted }]}><Text style={[localStyles.label, { color: theme.primary }]}>{slotCount} bữa được chọn · {days.length} ngày</Text><ActionText>{activeScope === 'EMPTY' ? 'Chỉ điền các bữa còn trống. Bạn có thể hoàn tác sau khi lưu.' : 'Các bữa đã chọn sẽ được thay thế. Ngày đã qua được giữ nguyên.'}</ActionText></View>
  </MealActionSheet>;
}

const localStyles = StyleSheet.create({
  intro: { borderRadius: Radius['2xl'], padding: Spacing.four, flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  introTitle: { fontFamily: Fonts.headingBold, fontSize: 18, lineHeight: 29 },
  sticker: { width: 78, height: 90 },
  card: { padding: Spacing.three, borderWidth: 1, borderRadius: Radius['2xl'], gap: Spacing.four },
  label: { fontFamily: Fonts.sansSemibold, fontSize: 15, lineHeight: 22 },
  summary: { padding: Spacing.three, borderWidth: 1, borderRadius: Radius.xl, gap: 5 },
});
