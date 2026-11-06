import { Image } from 'expo-image';
import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Fonts, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useSessionStore } from '@/shared/stores/session-store';

import { useRecipes } from '../hooks/use-recipes';
import { MAX_RECIPE_QUERY_LENGTH } from '../types/recipe.schema';
import { RecipeCard } from './recipe-card';

function useDebounced<T>(value: T, delayMs: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);
  return debounced;
}

export function RecipesScreen() {
  const theme = useTheme();
  const token = useSessionStore((state) => state.accessToken);
  const [text, setText] = useState('');
  const [suitableForMe, setSuitableForMe] = useState(false);
  const q = useDebounced(text.trim(), 350);
  const recipes = useRecipes({ q, suitableForMe: !!token && suitableForMe });
  const items = recipes.data?.pages.flatMap((page) => page.items) ?? [];

  function toggleSuitable() {
    if (!token) {
      router.push({ pathname: '/login', params: { returnTo: '/recipes' } });
      return;
    }
    setSuitableForMe((value) => !value);
  }

  return (
    <SafeAreaView edges={['top']} style={[styles.screen, { backgroundColor: theme.background }]}>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.list}
        onEndReached={() => { if (recipes.hasNextPage && !recipes.isFetching && !recipes.isFetchNextPageError) void recipes.fetchNextPage(); }}
        onEndReachedThreshold={0.5}
        refreshing={recipes.isRefetching}
        onRefresh={() => void recipes.refetch()}
        ListHeaderComponent={(
          <View style={styles.header}>
            <View style={styles.headingRow}>
              <View style={styles.headingCopy}>
                <Text accessibilityRole="header" style={[styles.heading, { color: theme.foreground }]}>Công thức</Text>
                <Text style={[styles.headingSub, { color: theme.mutedForeground }]}>Một chút xanh cho bữa ăn mỗi ngày</Text>
              </View>
              <Pressable accessibilityRole="button" accessibilityLabel="Xem công thức đã lưu" onPress={() => router.push({ pathname: '/bookmarks', params: { tab: 'recipes' } })} style={[styles.savedLink, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <SymbolView name={{ ios: 'bookmark', android: 'bookmark', web: 'bookmark' }} size={20} tintColor={theme.primary} />
                <Text style={[styles.chipText, { color: theme.foreground }]}>Đã lưu</Text>
              </Pressable>
            </View>
            <View style={[styles.hero, { backgroundColor: theme.secondary }]}>
              <View style={styles.heroCopy}>
                <Text style={[styles.eyebrow, { color: theme.secondaryForeground }]}>BẾP NHỎ VEDORA</Text>
                <Text style={[styles.heroTitle, { color: theme.foreground }]}>Hôm nay, mình{'\n'}nấu gì nhỉ?</Text>
                <Text style={[styles.heroSub, { color: theme.mutedForeground }]}>Tìm món ngon từ những nguyên liệu quen thuộc.</Text>
              </View>
              <View style={styles.stickerFrame}>
                <Image source={require('@/assets/branding/carrot-sticker.png')} style={styles.heroSticker} contentFit="contain" accessible={false} />
              </View>
            </View>
            <View style={[styles.search, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <SymbolView name={{ ios: 'magnifyingglass', android: 'search', web: 'search' }} size={19} tintColor={theme.mutedForeground} />
              <TextInput
                accessibilityLabel="Tìm công thức theo món hoặc nguyên liệu"
                value={text}
                onChangeText={setText}
                maxLength={MAX_RECIPE_QUERY_LENGTH}
                placeholder="Tìm món hoặc nguyên liệu..."
                placeholderTextColor={theme.mutedForeground}
                returnKeyType="search"
                autoCapitalize="none"
                style={[styles.searchInput, { color: theme.foreground }]}
              />
              {text.length > 0 ? (
                <Pressable accessibilityRole="button" accessibilityLabel="Xóa nội dung tìm kiếm" onPress={() => setText('')} style={styles.clear}>
                  <SymbolView name={{ ios: 'xmark.circle.fill', android: 'cancel', web: 'cancel' }} size={19} tintColor={theme.mutedForeground} />
                </Pressable>
              ) : null}
            </View>
            <View style={styles.suggestions}>
              {['Nấm', 'Đậu hũ', 'Canh'].map((keyword) => (
                <Pressable key={keyword} accessibilityRole="button" accessibilityLabel={`Tìm công thức ${keyword}`} accessibilityState={{ selected: text === keyword }} onPress={() => setText(text === keyword ? '' : keyword)} style={[styles.suggestion, { backgroundColor: text === keyword ? theme.secondary : theme.card, borderColor: text === keyword ? theme.primary : theme.border }]}>
                  <Text style={[styles.chipText, { color: theme.foreground }]}>{keyword}</Text>
                </Pressable>
              ))}
            </View>
            <Pressable
              accessibilityRole="switch"
              accessibilityState={{ checked: !!token && suitableForMe }}
              onPress={toggleSuitable}
              style={[styles.filter, { backgroundColor: token && suitableForMe ? theme.secondary : theme.card, borderColor: token && suitableForMe ? theme.primary : theme.border }]}
            >
              <SymbolView name={{ ios: 'leaf', android: 'eco', web: 'eco' }} size={24} tintColor={theme.primary} />
              <View style={styles.headingCopy}>
                <Text style={[styles.filterTitle, { color: theme.foreground }]}>Hợp với mình</Text>
                <Text style={[styles.headingSub, { color: theme.mutedForeground }]}>Lọc theo hồ sơ ăn uống của bạn</Text>
              </View>
              <View style={[styles.filterCheck, { backgroundColor: token && suitableForMe ? theme.primary : theme.muted }]}>
                <SymbolView name={{ ios: token && suitableForMe ? 'checkmark' : 'plus', android: token && suitableForMe ? 'check' : 'add', web: token && suitableForMe ? 'check' : 'add' }} size={18} tintColor={token && suitableForMe ? theme.primaryForeground : theme.mutedForeground} />
              </View>
            </Pressable>
            <View style={styles.sectionRow}>
              <Text accessibilityRole="header" style={[styles.sectionTitle, { color: theme.foreground }]}>{q ? 'Kết quả tìm kiếm' : token && suitableForMe ? 'Món hợp với bạn' : 'Khám phá món ngon'}</Text>
              {recipes.isFetching && !recipes.isPending ? <ActivityIndicator size="small" color={theme.primary} /> : null}
            </View>
          </View>
        )}
        ListEmptyComponent={recipes.isPending ? <ActivityIndicator color={theme.primary} style={styles.state} /> : recipes.isError ? (
          <Pressable accessibilityRole="button" onPress={() => void recipes.refetch()} style={styles.state}>
            <Text style={[styles.sub, { color: theme.destructive }]}>Không tải được công thức. Chạm để thử lại.</Text>
          </Pressable>
        ) : (
          <View style={[styles.empty, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Image source={require('@/assets/branding/avocado-sticker.png')} style={styles.emptySticker} contentFit="contain" accessible={false} />
            <Text style={[styles.emptyTitle, { color: theme.foreground }]}>{q || (token && suitableForMe) ? 'Chưa tìm thấy món phù hợp' : 'Chưa có công thức'}</Text>
            <Text style={[styles.sub, { color: theme.mutedForeground }]}>{q || (token && suitableForMe) ? 'Thử từ khóa khác hoặc bỏ bộ lọc.' : 'Kho công thức hiện chưa có món nào.'}</Text>
          </View>
        )}
        ListFooterComponent={recipes.isFetchingNextPage ? <ActivityIndicator color={theme.primary} style={styles.state} /> : recipes.isError && items.length ? (
          <Pressable accessibilityRole="button" onPress={() => void (recipes.isFetchNextPageError ? recipes.fetchNextPage() : recipes.refetch())} style={styles.state}>
            <Text style={[styles.sub, { color: theme.destructive }]}>Chưa tải được thêm món. Chạm để thử lại.</Text>
          </Pressable>
        ) : undefined}
        renderItem={({ item }) => <RecipeCard recipe={item} />}
      />
    </SafeAreaView>
  );
}


const styles = StyleSheet.create({
  screen: { flex: 1 },
  list: { width: '100%', maxWidth: 620, alignSelf: 'center', paddingHorizontal: Spacing.three, paddingBottom: Spacing.five, gap: Spacing.three },
  header: { gap: Spacing.three },
  headingRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, paddingTop: Spacing.three },
  savedLink: { minHeight: 44, borderWidth: 1, borderRadius: Radius.xl, paddingHorizontal: Spacing.two, flexDirection: 'row', alignItems: 'center', gap: Spacing.one },
  hero: { borderRadius: Radius['3xl'], padding: Spacing.three, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: Spacing.two },
  heroCopy: { flexGrow: 1, flexShrink: 1, flexBasis: 165, gap: Spacing.two },
  eyebrow: { fontFamily: Fonts.sansBold, fontSize: 11, letterSpacing: 1.3 },
  heroTitle: { fontFamily: Fonts.headingBold, fontSize: 25, lineHeight: 35 },
  heroSub: { fontFamily: Fonts.sans, fontSize: 14, lineHeight: 21 },
  stickerFrame: { width: 92, height: 116, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff2d8', borderRadius: 46, transform: [{ rotate: '7deg' }] },
  heroSticker: { width: 80, height: 104 },
  suggestions: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  suggestion: { minHeight: 40, borderWidth: 1, borderRadius: 22, paddingHorizontal: Spacing.three, paddingVertical: Spacing.two, justifyContent: 'center' },
  filter: { minHeight: 72, borderWidth: 1, borderRadius: Radius['2xl'], padding: Spacing.three, flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  filterTitle: { fontFamily: Fonts.sansBold, fontSize: 15 },
  filterCheck: { width: 30, height: 30, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
  sectionRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, marginTop: Spacing.one },
  sectionTitle: { flex: 1, fontFamily: Fonts.headingBold, fontSize: 18, lineHeight: 27 },
  emptySticker: { width: 80, height: 80 },
  headingCopy: { flex: 1, minWidth: 0 },
  heading: { fontFamily: Fonts.headingBold, fontSize: 23, lineHeight: 31 },
  headingSub: { fontFamily: Fonts.sans, fontSize: 13, lineHeight: 18 },
  search: { minHeight: 52, borderWidth: 1, borderRadius: Radius.xl, flexDirection: 'row', alignItems: 'center', gap: Spacing.two, paddingLeft: Spacing.three, paddingRight: Spacing.two },
  searchInput: { flex: 1, minWidth: 0, minHeight: 50, fontFamily: Fonts.sans, fontSize: 14, paddingVertical: 0 },
  clear: { minWidth: 36, minHeight: 36, alignItems: 'center', justifyContent: 'center' },
  chipText: { fontFamily: Fonts.sansSemibold, fontSize: 13 },
  state: { padding: Spacing.five, textAlign: 'center' },
  sub: { fontFamily: Fonts.sans, fontSize: 13, lineHeight: 19 },
  empty: { borderWidth: 1, borderRadius: Radius['2xl'], padding: Spacing.four, alignItems: 'center', gap: Spacing.two },
  emptyTitle: { fontFamily: Fonts.headingBold, fontSize: 16, textAlign: 'center' },
});
