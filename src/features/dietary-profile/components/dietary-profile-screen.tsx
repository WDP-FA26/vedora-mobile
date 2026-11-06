import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Fonts, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useSessionStore } from '@/shared/stores/session-store';

import { useDietaryProfile, useSaveDietaryProfile } from '../hooks/use-dietary-profile';
import type { DietaryRestrictions } from '../types/dietary-profile.schema';

type Selection = { groupIds: string[]; ingredientIds: string[] };

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
    const ids = current[kind];
    if (!ids.includes(id) && kind === 'ingredientIds' && ids.length >= 200) {
      setError('Bạn chỉ có thể chọn tối đa 200 nguyên liệu riêng lẻ.');
      return;
    }
    setSelection({ ...current, [kind]: ids.includes(id) ? ids.filter((value) => value !== id) : [...ids, id] });
    setError('');
    setNotice('');
  }

  function goBack() {
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
      setNotice('Đã lưu thực phẩm cần tránh vào hồ sơ ăn uống.');
    } catch {
      setError('Không lưu được hồ sơ ăn uống. Các lựa chọn vẫn còn để bạn thử lại.');
    }
  }

  if (!hydrated) return <SafeAreaView edges={['top']} style={[styles.screen, styles.center, { backgroundColor: theme.background }]}><ActivityIndicator color={theme.primary} /></SafeAreaView>;
  if (!token) return <SafeAreaView edges={['top']} style={[styles.screen, styles.center, { backgroundColor: theme.background }]}>
    <Text style={[styles.title, { color: theme.foreground }]}>Hồ sơ ăn uống</Text>
    <Text style={[styles.helper, styles.centerText, { color: theme.mutedForeground }]}>Đăng nhập để xem và cập nhật thực phẩm cần tránh.</Text>
    <Pressable accessibilityRole="button" onPress={() => router.push({ pathname: '/login', params: { returnTo: '/dietary-profile' } })} style={[styles.button, { backgroundColor: theme.primary }]}><Text style={[styles.buttonText, { color: theme.primaryForeground }]}>Đăng nhập</Text></Pressable>
  </SafeAreaView>;

  return <SafeAreaView edges={['top']} style={[styles.screen, { backgroundColor: theme.background }]}>
    <View style={[styles.header, { backgroundColor: theme.background, borderBottomColor: theme.border }]}>
      <Pressable accessibilityRole="button" accessibilityLabel="Quay lại hồ sơ" onPress={goBack} style={styles.back}><SymbolView name={{ ios: 'arrow.left', android: 'arrow_back', web: 'arrow_back' }} size={22} tintColor={theme.foreground} /></Pressable>
      <Text style={[styles.headerTitle, { color: theme.foreground }]}>Hồ sơ ăn uống</Text>
    </View>
    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
      <View style={[styles.intro, { backgroundColor: theme.secondary }]}>
        <Text style={[styles.introTitle, { color: theme.foreground }]}>Chọn thực phẩm phù hợp với bạn</Text>
        <Text style={[styles.helper, { color: theme.mutedForeground }]}>Trợ lý Vedora dùng danh sách cần tránh này khi gợi ý món và lên thực đơn.</Text>
      </View>
      {mine.isPending || options.isPending ? <View style={styles.loading}><ActivityIndicator color={theme.primary} /><Text style={[styles.helper, { color: theme.mutedForeground }]}>Đang tải hồ sơ ăn uống…</Text></View> : null}
      {mine.isError || options.isError ? <View style={[styles.errorBox, { borderColor: theme.destructive }]}><Text style={[styles.helper, { color: theme.destructive }]}>Chưa tải được {mine.isError ? 'hồ sơ ăn uống' : 'danh mục thực phẩm'}.</Text><Pressable accessibilityRole="button" onPress={() => { void mine.refetch(); void options.refetch(); }}><Text style={[styles.link, { color: theme.primary }]}>Thử lại</Text></Pressable></View> : null}

      {mine.data && options.data ? <>
        <View style={styles.sectionHeading}><View style={[styles.sectionIcon, { backgroundColor: theme.secondary }]}><SymbolView name={{ ios: 'checkmark.shield', android: 'verified_user', web: 'verified_user' }} size={22} tintColor={theme.primary} /></View><View style={styles.flex}><Text style={[styles.sectionTitle, { color: theme.foreground }]}>Thực phẩm tôi không ăn</Text><Text style={[styles.helper, { color: theme.mutedForeground }]}>Chọn nhóm thực phẩm hoặc từng nguyên liệu riêng lẻ.</Text></View></View>

        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.fieldTitle, { color: theme.foreground }]}>Nhóm thực phẩm</Text>
          <Text style={[styles.helper, { color: theme.mutedForeground }]}>Chọn một nhóm sẽ tránh mọi nguyên liệu trong nhóm đó.</Text>
          {selectedGroups.length ? <View style={styles.chips}>{selectedGroups.map(({ id, name }) => <Pressable key={id} accessibilityRole="button" accessibilityLabel={`Bỏ nhóm ${name}`} onPress={() => toggle('groupIds', id)} style={[styles.chip, { backgroundColor: theme.secondary }]}><Text style={[styles.chipText, { color: theme.primary }]}>{name}  ×</Text></Pressable>)}</View> : null}
          <Pressable accessibilityRole="button" accessibilityState={{ expanded: groupOpen }} onPress={() => setGroupOpen((value) => !value)} style={[styles.disclosure, { borderColor: theme.border, backgroundColor: theme.muted }]}><Text style={[styles.disclosureText, { color: theme.foreground }]}>{groupOpen ? 'Thu gọn nhóm thực phẩm' : 'Chọn nhóm thực phẩm'}</Text><SymbolView name={{ ios: groupOpen ? 'chevron.up' : 'chevron.down', android: 'expand_more', web: 'expand_more' }} size={18} tintColor={theme.primary} /></Pressable>
          {groupOpen ? <><TextInput accessibilityLabel="Tìm nhóm thực phẩm" value={groupSearch} onChangeText={setGroupSearch} placeholder="Ví dụ: sữa, hạt, gluten" placeholderTextColor={theme.mutedForeground} style={[styles.input, { color: theme.foreground, borderColor: theme.border, backgroundColor: theme.background }]} />
            <View style={styles.options}>{groupResults.map((item) => <Pressable key={item.id} accessibilityRole="checkbox" accessibilityState={{ checked: current.groupIds.includes(item.id) }} onPress={() => toggle('groupIds', item.id)} style={[styles.option, { borderColor: theme.border }]}><Text style={[styles.optionCheck, { color: theme.primary }]}>{current.groupIds.includes(item.id) ? '☑' : '□'}</Text><View style={styles.flex}><Text style={[styles.optionName, { color: theme.foreground }]}>{item.name}</Text>{item.ingredients.length ? <Text numberOfLines={2} style={[styles.helper, { color: theme.mutedForeground }]}>{item.ingredients.slice(0, 4).join(', ')}</Text> : null}</View></Pressable>)}{!groupResults.length ? <Text style={[styles.helper, { color: theme.mutedForeground }]}>Không tìm thấy nhóm phù hợp.</Text> : null}</View></> : null}
        </View>

        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.fieldTitle, { color: theme.foreground }]}>Nguyên liệu riêng lẻ</Text>
          <Text style={[styles.helper, { color: theme.mutedForeground }]}>Dùng cho những thứ bạn muốn tránh ngoài các nhóm trên.</Text>
          {selectedIngredients.length ? <View style={styles.chips}>{selectedIngredients.map(({ id, name }) => <Pressable key={id} accessibilityRole="button" accessibilityLabel={`Bỏ nguyên liệu ${name}`} onPress={() => toggle('ingredientIds', id)} style={[styles.chip, { backgroundColor: theme.secondary }]}><Text style={[styles.chipText, { color: theme.primary }]}>{name}  ×</Text></Pressable>)}</View> : null}
          <Pressable accessibilityRole="button" accessibilityState={{ expanded: ingredientOpen }} onPress={() => setIngredientOpen((value) => !value)} style={[styles.disclosure, { borderColor: theme.border, backgroundColor: theme.muted }]}><Text style={[styles.disclosureText, { color: theme.foreground }]}>{ingredientOpen ? 'Thu gọn nguyên liệu' : 'Chọn nguyên liệu'}</Text><SymbolView name={{ ios: ingredientOpen ? 'chevron.up' : 'chevron.down', android: 'expand_more', web: 'expand_more' }} size={18} tintColor={theme.primary} /></Pressable>
          {ingredientOpen ? <><TextInput accessibilityLabel="Tìm nguyên liệu cần tránh" value={ingredientSearch} onChangeText={setIngredientSearch} placeholder="Ví dụ: đậu phộng" placeholderTextColor={theme.mutedForeground} style={[styles.input, { color: theme.foreground, borderColor: theme.border, backgroundColor: theme.background }]} />
            <View style={styles.options}>{ingredientResults.map((item) => <Pressable key={item.id} accessibilityRole="checkbox" accessibilityState={{ checked: current.ingredientIds.includes(item.id) }} onPress={() => toggle('ingredientIds', item.id)} style={[styles.option, { borderColor: theme.border }]}><Text style={[styles.optionCheck, { color: theme.primary }]}>{current.ingredientIds.includes(item.id) ? '☑' : '□'}</Text><Text style={[styles.optionName, styles.flex, { color: theme.foreground }]}>{item.name}</Text></Pressable>)}{!ingredientResults.length ? <Text style={[styles.helper, { color: theme.mutedForeground }]}>Không tìm thấy nguyên liệu phù hợp.</Text> : null}</View></> : null}
        </View>

        <View style={[styles.comingSoon, { backgroundColor: theme.secondary }]}><Text style={[styles.fieldTitle, { color: theme.foreground }]}>Sở thích nguyên liệu</Text><Text style={[styles.helper, { color: theme.mutedForeground }]}>Sắp có trên ứng dụng.</Text></View>
      </> : null}
    </ScrollView>
    {mine.data && options.data ? <View style={[styles.footer, { backgroundColor: theme.card, borderTopColor: theme.border }]}>
      {error ? <Text accessibilityRole="alert" style={[styles.helper, { color: theme.destructive }]}>{error}</Text> : null}
      {notice ? <Text accessibilityRole="alert" style={[styles.helper, { color: theme.primary }]}>{notice}</Text> : null}
      <View style={styles.actions}><Pressable accessibilityRole="button" disabled={!dirty || save.isPending} onPress={() => { setSelection(savedSelection); setError(''); setNotice(''); }} style={[styles.secondaryButton, { borderColor: theme.border, opacity: !dirty ? 0.5 : 1 }]}><Text style={[styles.secondaryText, { color: theme.foreground }]}>Hủy thay đổi</Text></Pressable><Pressable accessibilityRole="button" disabled={!dirty || save.isPending} onPress={() => void submit()} style={[styles.button, styles.flex, { backgroundColor: theme.primary, opacity: !dirty || save.isPending ? 0.55 : 1 }]}><Text style={[styles.buttonText, { color: theme.primaryForeground }]}>{save.isPending ? 'Đang lưu…' : 'Lưu hồ sơ'}</Text></Pressable></View>
    </View> : null}
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  screen: { flex: 1 }, center: { justifyContent: 'center', alignItems: 'center', padding: Spacing.four, gap: Spacing.three }, centerText: { textAlign: 'center' }, flex: { flex: 1 },
  header: { minHeight: 54, borderBottomWidth: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.two, gap: Spacing.one }, back: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center' }, headerTitle: { fontFamily: Fonts.headingBold, fontSize: 18 },
  content: { width: '100%', maxWidth: 680, alignSelf: 'center', padding: Spacing.three, paddingBottom: Spacing.five, gap: Spacing.three }, intro: { borderRadius: Radius['2xl'], padding: Spacing.three, gap: Spacing.one }, introTitle: { fontFamily: Fonts.headingBold, fontSize: 17, lineHeight: 24 }, title: { fontFamily: Fonts.headingBold, fontSize: 22 }, helper: { fontFamily: Fonts.sans, fontSize: 13, lineHeight: 19 }, loading: { flexDirection: 'row', gap: Spacing.two, alignItems: 'center' }, errorBox: { borderWidth: 1, borderRadius: Radius.xl, padding: Spacing.three, gap: Spacing.two }, link: { fontFamily: Fonts.sansBold, fontSize: 14 },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, marginTop: Spacing.two }, sectionIcon: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' }, sectionTitle: { fontFamily: Fonts.headingBold, fontSize: 17, lineHeight: 24 }, card: { borderWidth: 1, borderRadius: Radius['2xl'], padding: Spacing.three, gap: Spacing.two }, fieldTitle: { fontFamily: Fonts.sansBold, fontSize: 15 }, chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two }, chip: { borderRadius: 20, minHeight: 36, paddingHorizontal: Spacing.three, justifyContent: 'center' }, chipText: { fontFamily: Fonts.sansSemibold, fontSize: 13 }, disclosure: { borderWidth: 1, borderRadius: Radius.xl, minHeight: 44, paddingHorizontal: Spacing.three, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, disclosureText: { fontFamily: Fonts.sansSemibold, fontSize: 14 }, input: { minHeight: 44, borderWidth: 1, borderRadius: Radius.xl, paddingHorizontal: Spacing.three, fontFamily: Fonts.sans, fontSize: 14 }, options: { gap: 0 }, option: { borderBottomWidth: StyleSheet.hairlineWidth, minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: Spacing.two, paddingVertical: Spacing.two }, optionCheck: { fontSize: 23 }, optionName: { fontFamily: Fonts.sansSemibold, fontSize: 14 }, comingSoon: { borderRadius: Radius.xl, padding: Spacing.three, gap: Spacing.one },
  footer: { borderTopWidth: 1, paddingHorizontal: Spacing.three, paddingVertical: Spacing.two, gap: Spacing.one }, actions: { maxWidth: 680, alignSelf: 'center', width: '100%', flexDirection: 'row', gap: Spacing.two }, button: { minHeight: 44, minWidth: 120, borderRadius: Radius.xl, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.three }, buttonText: { fontFamily: Fonts.sansBold, fontSize: 14 }, secondaryButton: { minHeight: 44, borderWidth: 1, borderRadius: Radius.xl, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.three }, secondaryText: { fontFamily: Fonts.sansSemibold, fontSize: 14 },
});
