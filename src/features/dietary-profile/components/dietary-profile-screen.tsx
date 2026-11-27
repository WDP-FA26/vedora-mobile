import { Image } from 'expo-image';
import { router, usePreventRemove } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useRef, useState } from 'react';
import { ActivityIndicator, Alert, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Fonts, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useSessionStore } from '@/shared/stores/session-store';

import { useDietaryProfile, useSaveDietaryProfile } from '../hooks/use-dietary-profile';
import { dietaryFormSchema, MAX_MEMORY_ITEMS, MAX_MEMORY_ITEM_LENGTH, memoryLines } from '../types/dietary-profile.schema';
import { NutritionSection } from './nutrition-section';

type MemoryText = { allergies: string; preferences: string };
const sections = [
  { key: 'allergies', label: 'Dị ứng & không ăn', hint: 'Dị ứng, không dung nạp hoặc những thứ cần tránh vì sức khỏe, tôn giáo.', placeholder: 'Dị ứng đậu phộng\nKhông dùng sữa bò' },
  { key: 'preferences', label: 'Sở thích & thói quen', hint: 'Món thích hoặc không thích, độ cay, ngân sách, số người ăn hay thói quen nấu nướng.', placeholder: 'Ăn ít cay\nNấu cho 2 người' },
] as const;

export function DietaryProfileScreen() {
  const theme = useTheme();
  const token = useSessionStore((state) => state.accessToken);
  const hydrated = useSessionStore((state) => state.isHydrated);
  const { mine } = useDietaryProfile(token);
  const save = useSaveDietaryProfile(token);
  const [draft, setDraft] = useState<{ token: string | null; text: Partial<MemoryText> } | null>(null);
  const [feedback, setFeedback] = useState<{ token: string | null; error?: string; notice?: string } | null>(null);
  const [discarded, setDiscarded] = useState(false);
  const saving = useRef(false);
  const saved = { allergies: mine.data?.allergies.join('\n') ?? '', preferences: mine.data?.preferences.join('\n') ?? '' };
  const current = { ...saved, ...(draft?.token === token ? draft.text : {}) };
  const changed = (key: keyof MemoryText) => JSON.stringify(memoryLines(current[key])) !== JSON.stringify(mine.data?.[key] ?? []);
  const dirty = !!token && !!mine.data && sections.some(({ key }) => changed(key));
  const busy = save.isPending;
  usePreventRemove(!discarded && (dirty || busy), ({ repeat }) => {
    if (saving.current || busy) return;
    const discard = () => { setDiscarded(true); repeat(); };
    if (Platform.OS === 'web') {
      if (window.confirm('Bỏ thay đổi chưa lưu?')) discard();
    } else Alert.alert('Bỏ thay đổi chưa lưu?', 'Nội dung vừa chỉnh sẽ không được lưu.', [
      { text: 'Tiếp tục chỉnh sửa', style: 'cancel' },
      { text: 'Bỏ thay đổi', style: 'destructive', onPress: discard },
    ]);
  });

  function edit(key: keyof MemoryText, text: string) {
    if (saving.current || busy) return;
    setDraft({ token, text: { ...(draft?.token === token ? draft.text : {}), [key]: text } });
    setDiscarded(false);
    setFeedback(null);
  }

  async function submit() {
    if (!dirty || !token || saving.current || busy) return;
    const input = dietaryFormSchema.safeParse(current);
    if (!input.success) { setFeedback({ token, error: input.error.issues[0]?.message ?? 'Kiểm tra lại ghi nhớ.' }); return; }
    saving.current = true;
    setFeedback(null);
    try {
      await save.mutateAsync({
        ...(changed('allergies') ? { allergies: input.data.allergies } : {}),
        ...(changed('preferences') ? { preferences: input.data.preferences } : {}),
      });
      setDraft(null);
      setFeedback({ token, notice: 'Đã lưu ghi nhớ của trợ lý.' });
    } catch {
      setFeedback({ token, error: 'Không lưu được hồ sơ ăn uống. Nội dung vẫn còn để bạn thử lại.' });
    } finally { saving.current = false; }
  }

  function back() {
    if (router.canGoBack()) router.back();
    else router.replace('/me');
  }

  if (!hydrated) return <SafeAreaView style={[styles.screen, styles.center, { backgroundColor: theme.background }]}><ActivityIndicator color={theme.primary} /></SafeAreaView>;
  if (!token) return <SafeAreaView style={[styles.screen, styles.center, { backgroundColor: theme.background }]}>
    <Text style={[styles.title, { color: theme.foreground }]}>Hồ sơ ăn uống</Text>
    <Text style={[styles.helper, { color: theme.mutedForeground }]}>Đăng nhập để cập nhật ghi nhớ của trợ lý và chỉ số cơ thể.</Text>
    <Pressable accessibilityRole="button" onPress={() => router.push({ pathname: '/login', params: { returnTo: '/dietary-profile' } })} style={[styles.button, { backgroundColor: theme.primary }]}><Text style={[styles.buttonText, { color: theme.primaryForeground }]}>Đăng nhập</Text></Pressable>
  </SafeAreaView>;

  return <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={[styles.screen, { backgroundColor: theme.background }]}>
    <View style={[styles.header, { borderBottomColor: theme.border }]}>
      <Pressable accessibilityRole="button" accessibilityLabel="Quay lại hồ sơ" disabled={busy} onPress={back} style={styles.back}><SymbolView name={{ ios: 'arrow.left', android: 'arrow_back', web: 'arrow_back' }} size={22} tintColor={theme.foreground} /></Pressable>
      <Text accessibilityRole="header" style={[styles.title, { color: theme.foreground }]}>Hồ sơ ăn uống</Text>
    </View>
    <ScrollView keyboardShouldPersistTaps="handled" automaticallyAdjustKeyboardInsets contentContainerStyle={styles.content}>
      <View style={[styles.intro, { backgroundColor: theme.secondary }]}>
        <View style={styles.heroCopy}>
          <Text style={[styles.title, { color: theme.foreground }]}>Ăn ngon hơn, theo cách của bạn</Text>
          <Text style={[styles.helper, { color: theme.secondaryForeground }]}>Nói Vedora biết bạn thích gì và cần tránh gì nhé.</Text>
        </View>
        <Image source={require('@/assets/branding/carrot-sticker.png')} style={styles.sticker} contentFit="contain" accessible={false} />
      </View>
      <NutritionSection token={token} />
      <Text style={[styles.title, { color: theme.foreground }]}>Ghi nhớ của trợ lý</Text>
      <Text style={[styles.helper, { color: theme.mutedForeground }]}>Trợ lý đọc mục này mỗi lần lên thực đơn và tự ghi thêm khi bạn kể trong lúc trò chuyện. Mỗi dòng một ý; bạn có thể sửa hoặc xóa bất cứ lúc nào.</Text>
      {mine.isPending ? <View style={styles.center}><ActivityIndicator color={theme.primary} /><Text style={[styles.helper, { color: theme.mutedForeground }]}>Đang tải ghi nhớ…</Text></View> : null}
      {mine.isError ? <View style={[styles.card, { borderColor: theme.destructive }]}>
        <Text accessibilityRole="alert" style={[styles.helper, { color: theme.destructive }]}>Chưa tải được ghi nhớ của trợ lý.</Text>
        <Pressable accessibilityRole="button" onPress={() => void mine.refetch()} style={styles.button}><Text style={[styles.buttonText, { color: theme.primary }]}>Thử lại</Text></Pressable>
      </View> : null}
      {mine.data ? sections.map(({ key, label, hint, placeholder }) => <View key={key} style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <Text style={[styles.fieldTitle, { color: theme.foreground }]}>{label}</Text>
        <Text style={[styles.helper, { color: theme.mutedForeground }]}>{hint} Mỗi mục tối đa {MAX_MEMORY_ITEMS} dòng, mỗi dòng {MAX_MEMORY_ITEM_LENGTH} ký tự. Xóa hết rồi lưu để bỏ ghi nhớ của mục này.</Text>
        <TextInput accessibilityLabel={label} value={current[key]} onChangeText={(text) => edit(key, text)} editable={!busy} multiline textAlignVertical="top"
          placeholder={placeholder} placeholderTextColor={theme.mutedForeground} style={[styles.input, { color: theme.foreground, borderColor: theme.border, backgroundColor: theme.background }]} />
        <Text style={[styles.counter, { color: memoryLines(current[key]).length > MAX_MEMORY_ITEMS ? theme.destructive : theme.mutedForeground }]}>{memoryLines(current[key]).length}/{MAX_MEMORY_ITEMS} dòng</Text>
      </View>) : null}
      {feedback?.token === token && feedback.error ? <Text accessibilityRole="alert" style={[styles.helper, { color: theme.destructive }]}>{feedback.error}</Text> : null}
      {feedback?.token === token && feedback.notice ? <Text accessibilityRole="alert" style={[styles.helper, { color: theme.primary }]}>{feedback.notice}</Text> : null}
      {mine.data ? <View style={styles.actions}>
        <Pressable accessibilityRole="button" disabled={!dirty || busy} onPress={() => { setDraft(null); setFeedback(null); setDiscarded(false); }} style={[styles.button, { borderWidth: 1, borderColor: theme.border, opacity: !dirty || busy ? 0.5 : 1 }]}><Text style={[styles.buttonText, { color: theme.foreground }]}>Hủy thay đổi</Text></Pressable>
        <Pressable accessibilityRole="button" disabled={!dirty || busy} onPress={() => void submit()} style={[styles.button, styles.flex, { backgroundColor: theme.primary, opacity: !dirty || busy ? 0.5 : 1 }]}><Text style={[styles.buttonText, { color: theme.primaryForeground }]}>{busy ? 'Đang lưu…' : 'Lưu hồ sơ'}</Text></Pressable>
      </View> : null}
    </ScrollView>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  screen: { flex: 1 }, flex: { flex: 1 },
  center: { justifyContent: 'center', alignItems: 'center', padding: Spacing.four, gap: Spacing.three },
  header: { minHeight: 64, borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.three, gap: Spacing.three },
  back: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: Fonts.headingBold, fontSize: 19, lineHeight: 28 },
  fieldTitle: { fontFamily: Fonts.sansBold, fontSize: 16, lineHeight: 24 },
  helper: { fontFamily: Fonts.sans, fontSize: 14, lineHeight: 22 },
  content: { width: '100%', maxWidth: 680, alignSelf: 'center', padding: Spacing.three, paddingBottom: Spacing.five, gap: Spacing.three },
  intro: { borderRadius: Radius['3xl'], padding: Spacing.three, flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  heroCopy: { flex: 1, gap: Spacing.two }, sticker: { width: 60, height: 80 },
  card: { borderWidth: 1, borderRadius: Radius['2xl'], padding: Spacing.three, gap: Spacing.two },
  input: { minHeight: 140, maxHeight: 300, borderWidth: 1, borderRadius: Radius.xl, padding: Spacing.three, fontFamily: Fonts.sans, fontSize: 15, lineHeight: 23 },
  counter: { fontFamily: Fonts.sans, fontSize: 12, textAlign: 'right' },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  button: { minHeight: 50, minWidth: 110, borderRadius: Radius.xl, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.three, paddingVertical: Spacing.two },
  buttonText: { fontFamily: Fonts.sansBold, fontSize: 15 },
});
