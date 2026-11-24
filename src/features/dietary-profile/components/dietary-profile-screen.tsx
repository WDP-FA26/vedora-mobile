import { Image } from 'expo-image';
import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BrandColors, Fonts, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useSessionStore } from '@/shared/stores/session-store';

import { useDietaryProfile, useSaveDietaryProfile } from '../hooks/use-dietary-profile';
import { NutritionSection } from './nutrition-section';
import type { DietaryRestrictions, DietaryUpdate } from '../types/dietary-profile.schema';

type Selection = DietaryUpdate;

function fromRestrictions(value: DietaryRestrictions): Selection {
  return {
    groupIds: value.groups.map(({ id }) => id),
    ingredientIds: value.ingredients.map(({ id }) => id),
  };
}

function sameIds(first: string[], second: string[]) {
  return first.length === second.length && first.every((id) => second.includes(id));
}

function matches(name: string, query: string) {
  return name.toLocaleLowerCase('vi').includes(query.toLocaleLowerCase('vi'));
}

function SelectionCheck({ checked }: { checked: boolean }) {
  const theme = useTheme();
  return <View style={[styles.checkbox, { backgroundColor: checked ? theme.primary : theme.card, borderColor: checked ? theme.primary : theme.border }]}>
    {checked ? <SymbolView name={{ ios: 'checkmark', android: 'check', web: 'check' }} size={15} tintColor={theme.primaryForeground} /> : null}
  </View>;
}

export function DietaryProfileScreen() {
  const theme = useTheme();
  const token = useSessionStore((state) => state.accessToken);
  const hydrated = useSessionStore((state) => state.isHydrated);
  const { options, mine } = useDietaryProfile(token);
  const save = useSaveDietaryProfile(token);
  const [selection, setSelection] = useState<Selection | null>(null);
  const [saved, setSaved] = useState<Selection | null>(null);
  const [groupSearch, setGroupSearch] = useState('');
  const [ingredientSearch, setIngredientSearch] = useState('');
  const [groupOpen, setGroupOpen] = useState(false);
  const [ingredientOpen, setIngredientOpen] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const savedSelection = saved ?? (mine.data ? fromRestrictions(mine.data) : null);
  const current = selection ?? savedSelection ?? { groupIds: [], ingredientIds: [] };
  const dirty = !!savedSelection && (!sameIds(current.groupIds, savedSelection.groupIds) || !sameIds(current.ingredientIds, savedSelection.ingredientIds));
  const ingredientNames = useMemo(() => new Map(options.data?.ingredients.map(({ id, name }) => [id, name]) ?? []), [options.data]);
  const groupNames = useMemo(() => new Map(options.data?.groups.map(({ id, name }) => [id, name]) ?? []), [options.data]);
  const selectedGroups = current.groupIds.map((id) => ({ id, name: groupNames.get(id) ?? mine.data?.groups.find((item) => item.id === id)?.name ?? id }));
  const selectedIngredients = current.ingredientIds.map((id) => ({ id, name: ingredientNames.get(id) ?? mine.data?.ingredients.find((item) => item.id === id)?.name ?? id }));
  const groupResults = options.data?.groups.filter((item) => matches(item.name, groupSearch.trim())).slice(0, 40) ?? [];
  const ingredientResults = options.data?.ingredients.filter((item) => matches(item.name, ingredientSearch.trim()) || item.aliases.some((alias) => matches(alias, ingredientSearch.trim()))).slice(0, 50) ?? [];

  function toggle(kind: keyof Selection, id: string) {
    if (save.isPending) return;
    const ids = current[kind];
    const limit = kind === 'groupIds' ? 50 : 200;
    if (!ids.includes(id) && ids.length >= limit) {
      setError(`Bạn chỉ có thể chọn tối đa ${limit} ${kind === 'groupIds' ? 'nhóm thực phẩm' : 'nguyên liệu'}.`);
      return;
    }
    setSelection({ ...current, [kind]: ids.includes(id) ? ids.filter((value) => value !== id) : [...ids, id] });
    setError('');
    setNotice('');
  }

  function goBack() {
    if (save.isPending) return;
    if (!dirty) { router.back(); return; }
    Alert.alert('Bỏ thay đổi chưa lưu?', 'Các lựa chọn vừa chỉnh sẽ không được lưu.', [
      { text: 'Tiếp tục chỉnh sửa', style: 'cancel' },
      { text: 'Bỏ thay đổi', style: 'destructive', onPress: () => router.back() },
    ]);
  }

  async function submit() {
    if (!dirty || !options.data || !mine.data || !token || save.isPending) return;
    setError('');
    setNotice('');
    try {
      const result = await save.mutateAsync(current);
      const next = fromRestrictions(result);
      setSelection(next);
      setSaved(next);
      setNotice('Đã lưu thực phẩm cần tránh.');
    } catch {
      setError('Không lưu được hồ sơ ăn uống. Các lựa chọn vẫn còn để bạn thử lại.');
    }
  }

  if (!hydrated) return <SafeAreaView edges={['top']} style={[styles.screen, styles.center, { backgroundColor: theme.background }]}><ActivityIndicator color={theme.primary} /></SafeAreaView>;
  if (!token) return <SafeAreaView edges={['top']} style={[styles.screen, styles.center, { backgroundColor: theme.background }]}>
    <Image source={require('@/assets/branding/avocado-sticker.png')} style={styles.guestSticker} contentFit="contain" accessible={false} />
    <Text style={[styles.title, { color: theme.foreground }]}>Hồ sơ ăn uống</Text>
    <Text style={[styles.helper, styles.centerText, { color: theme.mutedForeground }]}>Đăng nhập để cập nhật thực phẩm cần tránh và chỉ số cơ thể.</Text>
    <Pressable accessibilityRole="button" onPress={() => router.push({ pathname: '/login', params: { returnTo: '/dietary-profile' } })} style={[styles.button, { backgroundColor: theme.primary }]}><Text style={[styles.buttonText, { color: theme.primaryForeground }]}>Đăng nhập</Text></Pressable>
  </SafeAreaView>;

  return <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={[styles.screen, { backgroundColor: theme.background }]}>
    <View style={[styles.header, { backgroundColor: theme.background, borderBottomColor: theme.border }]}>
      <Pressable accessibilityRole="button" accessibilityLabel="Quay lại hồ sơ" disabled={save.isPending} onPress={goBack} style={[styles.back, { backgroundColor: theme.muted }]}><SymbolView name={{ ios: 'arrow.left', android: 'arrow_back', web: 'arrow_back' }} size={20} tintColor={theme.foreground} /></Pressable>
      <View style={styles.flex}><Text style={[styles.headerTitle, { color: theme.foreground }]}>Hồ sơ ăn uống</Text><Text style={[styles.helper, { color: theme.mutedForeground }]}>Một chút riêng, đúng vị bạn</Text></View>
    </View>
    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
      <View style={[styles.intro, { backgroundColor: theme.secondary }]}>
        <View style={styles.heroRow}>
          <View style={styles.heroCopy}>
            <Text style={[styles.eyebrow, { color: theme.secondaryForeground }]}>GÓC ĂN UỐNG CỦA BẠN</Text>
            <Text style={[styles.introTitle, { color: theme.foreground }]}>Ăn ngon hơn,{ '\n' }theo cách của bạn</Text>
            <Text style={[styles.helper, { color: theme.secondaryForeground }]}>Nói Vedora biết bạn thích gì và cần tránh gì nhé.</Text>
          </View>
          <View style={styles.heroStickerFrame}><Image source={require('@/assets/branding/carrot-sticker.png')} contentFit="contain" style={styles.heroSticker} accessible={false} /></View>
        </View>
        {mine.data ? <View style={[styles.summary, { borderColor: theme.border }]}>
          {[{ value: current.groupIds.length, label: 'Nhóm không ăn' }, { value: current.ingredientIds.length, label: 'Nguyên liệu tránh' }].map(({ value, label }) => <View key={label} style={[styles.summaryItem, { backgroundColor: theme.card }]}><Text style={[styles.summaryValue, { color: theme.primary }]}>{value}</Text><Text style={[styles.summaryLabel, { color: theme.mutedForeground }]}>{label}</Text></View>)}
        </View> : null}
      </View>
      {mine.isPending || options.isPending ? <View style={styles.loading}><ActivityIndicator color={theme.primary} /><Text style={[styles.helper, { color: theme.mutedForeground }]}>Đang tải hồ sơ ăn uống…</Text></View> : null}
      {mine.isError || options.isError ? <View style={[styles.errorBox, { borderColor: theme.destructive }]}><Text style={[styles.helper, { color: theme.destructive }]}>Chưa tải được {mine.isError ? 'hồ sơ ăn uống' : 'danh mục thực phẩm'}.</Text><Pressable accessibilityRole="button" onPress={() => { void mine.refetch(); void options.refetch(); }}><Text style={[styles.link, { color: theme.primary }]}>Thử lại</Text></Pressable></View> : null}

      <NutritionSection token={token} />

      {mine.data && options.data ? <>
        <View style={styles.sectionHeading}><View style={[styles.sectionIcon, { backgroundColor: theme.muted }]}><Image source={require('@/assets/branding/avocado-sticker.png')} contentFit="contain" style={styles.sectionSticker} accessible={false} /></View><View style={styles.heroCopy}><Text style={[styles.sectionTitle, { color: theme.foreground }]}>Những món mình tránh</Text><Text style={[styles.helper, { color: theme.mutedForeground }]}>Để mỗi gợi ý đều phù hợp với bạn.</Text></View></View>

        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.fieldHeading}><Text style={[styles.fieldTitle, styles.flex, { color: theme.foreground }]}>Nhóm thực phẩm</Text><Text style={[styles.count, { color: theme.primary, backgroundColor: theme.secondary }]}>{current.groupIds.length}/50</Text></View>
          <Text style={[styles.helper, { color: theme.mutedForeground }]}>Chọn một nhóm sẽ tránh mọi nguyên liệu trong nhóm đó.</Text>
          {selectedGroups.length ? <View style={styles.chips}>{selectedGroups.map(({ id, name }) => <Pressable key={id} accessibilityRole="button" accessibilityLabel={`Bỏ nhóm ${name}`} onPress={() => toggle('groupIds', id)} style={[styles.chip, { backgroundColor: theme.secondary }]}><Text style={[styles.chipText, { color: theme.primary }]}>{name}  ×</Text></Pressable>)}</View> : null}
          <Pressable accessibilityRole="button" accessibilityState={{ expanded: groupOpen }} onPress={() => setGroupOpen((value) => !value)} style={[styles.disclosure, { borderColor: theme.border, backgroundColor: theme.muted }]}><Text style={[styles.disclosureText, { color: theme.foreground }]}>{groupOpen ? 'Thu gọn nhóm thực phẩm' : 'Chọn nhóm thực phẩm'}</Text><SymbolView name={{ ios: groupOpen ? 'chevron.up' : 'chevron.down', android: 'expand_more', web: 'expand_more' }} size={18} tintColor={theme.primary} /></Pressable>
          {groupOpen ? <><TextInput accessibilityLabel="Tìm nhóm thực phẩm" value={groupSearch} onChangeText={setGroupSearch} placeholder="Ví dụ: sữa, hạt, gluten" placeholderTextColor={theme.mutedForeground} style={[styles.input, { color: theme.foreground, borderColor: theme.border, backgroundColor: theme.background }]} />
            <View style={styles.options}>{groupResults.map((item) => <Pressable key={item.id} accessibilityRole="checkbox" disabled={save.isPending} accessibilityState={{ checked: current.groupIds.includes(item.id), disabled: save.isPending }} onPress={() => toggle('groupIds', item.id)} style={[styles.option, { borderColor: theme.border }]}><SelectionCheck checked={current.groupIds.includes(item.id)} /><View style={styles.flex}><Text style={[styles.optionName, { color: theme.foreground }]}>{item.name}</Text>{item.ingredients.length ? <Text numberOfLines={2} style={[styles.helper, { color: theme.mutedForeground }]}>{item.ingredients.slice(0, 4).join(', ')}</Text> : null}</View></Pressable>)}{!groupResults.length ? <Text style={[styles.helper, { color: theme.mutedForeground }]}>Không tìm thấy nhóm phù hợp.</Text> : null}</View></> : null}
        </View>

        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.fieldHeading}><Text style={[styles.fieldTitle, styles.flex, { color: theme.foreground }]}>Nguyên liệu riêng lẻ</Text><Text style={[styles.count, { color: theme.primary, backgroundColor: theme.secondary }]}>{current.ingredientIds.length}/200</Text></View>
          <Text style={[styles.helper, { color: theme.mutedForeground }]}>Dùng cho những thứ bạn muốn tránh ngoài các nhóm trên.</Text>
          {selectedIngredients.length ? <View style={styles.chips}>{selectedIngredients.map(({ id, name }) => <Pressable key={id} accessibilityRole="button" accessibilityLabel={`Bỏ nguyên liệu ${name}`} onPress={() => toggle('ingredientIds', id)} style={[styles.chip, { backgroundColor: theme.secondary }]}><Text style={[styles.chipText, { color: theme.primary }]}>{name}  ×</Text></Pressable>)}</View> : null}
          <Pressable accessibilityRole="button" accessibilityState={{ expanded: ingredientOpen }} onPress={() => setIngredientOpen((value) => !value)} style={[styles.disclosure, { borderColor: theme.border, backgroundColor: theme.muted }]}><Text style={[styles.disclosureText, { color: theme.foreground }]}>{ingredientOpen ? 'Thu gọn nguyên liệu' : 'Chọn nguyên liệu'}</Text><SymbolView name={{ ios: ingredientOpen ? 'chevron.up' : 'chevron.down', android: 'expand_more', web: 'expand_more' }} size={18} tintColor={theme.primary} /></Pressable>
          {ingredientOpen ? <><TextInput accessibilityLabel="Tìm nguyên liệu cần tránh" value={ingredientSearch} onChangeText={setIngredientSearch} placeholder="Ví dụ: đậu phộng" placeholderTextColor={theme.mutedForeground} style={[styles.input, { color: theme.foreground, borderColor: theme.border, backgroundColor: theme.background }]} />
            <View style={styles.options}>{ingredientResults.map((item) => <Pressable key={item.id} accessibilityRole="checkbox" disabled={save.isPending} accessibilityState={{ checked: current.ingredientIds.includes(item.id), disabled: save.isPending }} onPress={() => toggle('ingredientIds', item.id)} style={[styles.option, { borderColor: theme.border }]}><SelectionCheck checked={current.ingredientIds.includes(item.id)} /><Text style={[styles.optionName, styles.flex, { color: theme.foreground }]}>{item.name}</Text></Pressable>)}{!ingredientResults.length ? <Text style={[styles.helper, { color: theme.mutedForeground }]}>Không tìm thấy nguyên liệu phù hợp.</Text> : null}</View></> : null}
        </View>

        <View style={[styles.tip, { backgroundColor: theme.muted }]}><SymbolView name={{ ios: 'sparkles', android: 'auto_awesome', web: 'auto_awesome' }} size={18} tintColor={theme.primary} /><Text style={[styles.helper, styles.flex, { color: theme.mutedForeground }]}>Vedora ưu tiên tránh thực phẩm bạn không ăn trước, rồi mới gợi ý món. Bạn có thể thay đổi bất cứ lúc nào.</Text></View>
      </> : null}
    </ScrollView>
    {mine.data && options.data ? <View style={[styles.footer, { backgroundColor: theme.card, borderTopColor: theme.border }]}>
      <Text style={[styles.footerStatus, { color: dirty ? theme.primary : theme.mutedForeground }]}>{dirty ? 'Bạn có thay đổi chưa lưu' : 'Khẩu vị của bạn, Vedora ghi nhớ'}</Text>
      {error ? <Text accessibilityRole="alert" style={[styles.helper, { color: theme.destructive }]}>{error}</Text> : null}
      {notice ? <Text accessibilityRole="alert" style={[styles.helper, { color: theme.primary }]}>{notice}</Text> : null}
      <View style={styles.actions}><Pressable accessibilityRole="button" disabled={!dirty || save.isPending} onPress={() => { setSelection(savedSelection); setError(''); setNotice(''); }} style={[styles.secondaryButton, { borderColor: theme.border, opacity: !dirty ? 0.5 : 1 }]}><Text style={[styles.secondaryText, { color: theme.foreground }]}>Hủy thay đổi</Text></Pressable><Pressable accessibilityRole="button" disabled={!dirty || save.isPending} onPress={() => void submit()} style={[styles.button, styles.flex, { backgroundColor: theme.primary, opacity: !dirty || save.isPending ? 0.55 : 1 }]}><Text style={[styles.buttonText, { color: theme.primaryForeground }]}>{save.isPending ? 'Đang lưu…' : 'Lưu hồ sơ'}</Text></Pressable></View>
    </View> : null}
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  center: { justifyContent: 'center', alignItems: 'center', padding: Spacing.four, gap: Spacing.three },
  centerText: { textAlign: 'center' },
  flex: { flex: 1, minWidth: 0 },
  header: { minHeight: 80, borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.three, gap: 12 },
  back: { width: 44, height: 44, borderRadius: Radius.xl, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontFamily: Fonts.headingBold, fontSize: 18, lineHeight: 27 },
  content: { width: '100%', maxWidth: 680, alignSelf: 'center', padding: Spacing.three, paddingBottom: Spacing.four, gap: 14 },
  intro: { borderRadius: Radius['4xl'], padding: 18, gap: 18 },
  heroRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  heroCopy: { flex: 1, minWidth: 0, gap: 6 },
  eyebrow: { fontFamily: Fonts.sansBold, fontSize: 10, lineHeight: 16, letterSpacing: 1.1 },
  introTitle: { fontFamily: Fonts.headingBold, fontSize: 22, lineHeight: 32 },
  heroStickerFrame: { width: 72, height: 94, borderRadius: 36, backgroundColor: BrandColors.cream, alignItems: 'center', justifyContent: 'center', transform: [{ rotate: '8deg' }] },
  heroSticker: { width: 60, height: 82 },
  guestSticker: { width: 84, height: 96 },
  summary: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 14 },
  summaryItem: { flex: 1, flexBasis: 74, paddingVertical: 10, paddingHorizontal: 6, borderRadius: Radius.xl, alignItems: 'center', gap: 3 },
  summaryValue: { fontFamily: Fonts.headingBold, fontSize: 20, lineHeight: 28 },
  summaryLabel: { fontFamily: Fonts.sansSemibold, fontSize: 11, lineHeight: 16, textAlign: 'center' },
  title: { fontFamily: Fonts.headingBold, fontSize: 22 },
  helper: { fontFamily: Fonts.sans, fontSize: 13, lineHeight: 20 },
  loading: { flexDirection: 'row', gap: Spacing.two, alignItems: 'center', paddingVertical: 12 },
  errorBox: { borderWidth: 1, borderRadius: Radius.xl, padding: Spacing.three, gap: Spacing.two },
  link: { fontFamily: Fonts.sansBold, fontSize: 14 },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 12, marginBottom: 2 },
  sectionIcon: { width: 52, height: 56, borderRadius: Radius['2xl'], alignItems: 'center', justifyContent: 'center' },
  sectionSticker: { width: 42, height: 48 },
  sectionTitle: { fontFamily: Fonts.headingBold, fontSize: 17, lineHeight: 26 },
  card: { borderWidth: 1, borderRadius: Radius['3xl'], padding: Spacing.three, gap: 12 },
  fieldHeading: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  fieldTitle: { fontFamily: Fonts.sansBold, fontSize: 16, lineHeight: 24 },
  count: { fontFamily: Fonts.sansBold, fontSize: 12, lineHeight: 18, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, overflow: 'hidden' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderRadius: Radius.xl, minHeight: 44, paddingVertical: 8, paddingHorizontal: 12, justifyContent: 'center', maxWidth: '100%' },
  chipText: { fontFamily: Fonts.sansSemibold, fontSize: 13, lineHeight: 20 },
  disclosure: { borderWidth: 1, borderRadius: Radius.xl, minHeight: 48, paddingHorizontal: 14, paddingVertical: 10, flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'space-between' },
  disclosureText: { flex: 1, fontFamily: Fonts.sansSemibold, fontSize: 14, lineHeight: 21 },
  input: { minHeight: 48, borderWidth: 1, borderRadius: Radius.xl, paddingHorizontal: 14, paddingVertical: 10, fontFamily: Fonts.sans, fontSize: 15 },
  options: { gap: 0 },
  option: { borderBottomWidth: StyleSheet.hairlineWidth, minHeight: 54, flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  checkbox: { width: 24, height: 24, borderWidth: 1.5, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  optionName: { fontFamily: Fonts.sansSemibold, fontSize: 15, lineHeight: 22 },
  tip: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, borderRadius: Radius['2xl'], padding: Spacing.three },
  footer: { borderTopWidth: StyleSheet.hairlineWidth, paddingHorizontal: Spacing.three, paddingVertical: 12, gap: 8 },
  footerStatus: { fontFamily: Fonts.sansSemibold, fontSize: 12, lineHeight: 18, textAlign: 'center' },
  actions: { maxWidth: 680, alignSelf: 'center', width: '100%', flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  button: { minHeight: 50, minWidth: 120, borderRadius: Radius['2xl'], alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16, paddingVertical: 12 },
  buttonText: { fontFamily: Fonts.sansBold, fontSize: 15, lineHeight: 22 },
  secondaryButton: { minHeight: 50, borderWidth: 1, borderRadius: Radius['2xl'], alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16, paddingVertical: 12 },
  secondaryText: { fontFamily: Fonts.sansSemibold, fontSize: 14, lineHeight: 22 },
});
