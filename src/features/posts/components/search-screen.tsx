import { router, useLocalSearchParams } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Fonts, Radius, Spacing } from '@/constants/theme';
import { PostCard } from '@/features/feed/components/post-card';
import { RecipeCard } from '@/features/recipes/components/recipe-card';
import { useRecipes } from '@/features/recipes/hooks/use-recipes';
import { MAX_RECIPE_QUERY_LENGTH } from '@/features/recipes/types/recipe.schema';
import { useTheme } from '@/hooks/use-theme';
import { useSessionStore } from '@/shared/stores/session-store';

import { usePostSearch } from '../hooks/use-posts';
import { MAX_SEARCH_QUERY_LENGTH } from '../types/posts.schema';

type SearchTab = 'posts' | 'recipes';

const TABS: { key: SearchTab; label: string; placeholder: string; maxLength: number }[] = [
  { key: 'posts', label: 'Bài viết', placeholder: 'Tìm bài viết...', maxLength: MAX_SEARCH_QUERY_LENGTH },
  { key: 'recipes', label: 'Công thức', placeholder: 'Tìm món hoặc nguyên liệu...', maxLength: MAX_RECIPE_QUERY_LENGTH },
];

/** The one search in the app. `tab` and `q` route params open it on a tab, optionally with a query already typed. */
export function SearchScreen() {
  const theme = useTheme();
  const params = useLocalSearchParams<{ tab?: string; q?: string }>();
  const [tab, setTab] = useState<SearchTab>(params.tab === 'recipes' ? 'recipes' : 'posts');
  const [text, setText] = useState(params.q ?? '');
  const [q, setQ] = useState((params.q ?? '').trim());
  const current = TABS.find((item) => item.key === tab)!;

  useEffect(() => {
    const timer = setTimeout(() => setQ(text.trim()), 350);
    return () => clearTimeout(timer);
  }, [text]);

  return (
    <SafeAreaView edges={['top']} style={[styles.screen, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.background, borderBottomColor: theme.border }]}>
        <View style={styles.headerRow}>
          <Pressable accessibilityRole="button" accessibilityLabel="Quay lại" onPress={() => (router.canGoBack() ? router.back() : router.replace('/explore'))} hitSlop={10} style={styles.back}>
            <SymbolView name={{ ios: 'chevron.left', android: 'arrow_back', web: 'arrow_back' }} size={22} tintColor={theme.foreground} />
          </Pressable>
          <View style={[styles.search, { backgroundColor: theme.background, borderColor: theme.border }]}>
            <SymbolView name={{ ios: 'magnifyingglass', android: 'search', web: 'search' }} size={18} tintColor={theme.mutedForeground} />
            <TextInput
              accessibilityLabel={tab === 'recipes' ? 'Tìm công thức theo món hoặc nguyên liệu' : 'Tìm bài viết'}
              autoFocus={!params.q}
              value={text}
              onChangeText={setText}
              maxLength={current.maxLength}
              placeholder={current.placeholder}
              placeholderTextColor={theme.mutedForeground}
              returnKeyType="search"
              autoCapitalize="none"
              style={[styles.input, { color: theme.foreground }]}
            />
            {text.length > 0 ? (
              <Pressable accessibilityRole="button" accessibilityLabel="Xóa nội dung tìm kiếm" onPress={() => setText('')} hitSlop={8}>
                <SymbolView name={{ ios: 'xmark.circle.fill', android: 'cancel', web: 'cancel' }} size={18} tintColor={theme.mutedForeground} />
              </Pressable>
            ) : null}
          </View>
        </View>
        <View accessibilityRole="tablist" style={styles.tabs}>
          {TABS.map((item) => {
            const selected = item.key === tab;
            return (
              <Pressable
                key={item.key}
                accessibilityRole="tab"
                accessibilityState={{ selected }}
                onPress={() => setTab(item.key)}
                style={[styles.tab, { borderBottomColor: selected ? theme.primary : 'transparent' }]}>
                <Text style={[styles.tabText, { color: selected ? theme.primary : theme.mutedForeground }]}>{item.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>
      {tab === 'posts' ? <PostResults q={q} /> : <RecipeResults q={q.slice(0, MAX_RECIPE_QUERY_LENGTH)} />}
    </SafeAreaView>
  );
}

function PostResults({ q }: { q: string }) {
  const theme = useTheme();
  const search = usePostSearch(q);
  const posts = search.data?.pages.flatMap((page) => page.items).filter((post) => post.status === 'PUBLISHED') ?? [];
  return (
    <FlatList
      data={posts}
      keyExtractor={(post) => post.id}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={styles.list}
      onEndReached={() => { if (search.hasNextPage && !search.isFetchingNextPage) void search.fetchNextPage(); }}
      onEndReachedThreshold={0.5}
      renderItem={({ item }) => <PostCard post={item} visible={false} />}
      ListEmptyComponent={!q ? (
        <Text style={[styles.sub, styles.state, { color: theme.mutedForeground }]}>Nhập từ khóa để tìm bài viết.</Text>
      ) : search.isPending ? <ActivityIndicator color={theme.primary} style={styles.state} /> : search.isError ? (
        <Pressable accessibilityRole="button" onPress={() => void search.refetch()} style={styles.state}>
          <Text style={[styles.sub, { color: theme.destructive }]}>Không tìm được lúc này. Chạm để thử lại.</Text>
        </Pressable>
      ) : <Text style={[styles.sub, styles.state, { color: theme.mutedForeground }]}>Không có bài viết nào khớp “{q}”.</Text>}
      ListFooterComponent={search.isFetchingNextPage ? <ActivityIndicator color={theme.primary} style={styles.state} /> : undefined}
    />
  );
}

function RecipeResults({ q }: { q: string }) {
  const theme = useTheme();
  const token = useSessionStore((state) => state.accessToken);
  const [suitableForMe, setSuitableForMe] = useState(false);
  const suitable = !!token && suitableForMe;
  // Nothing typed and no filter: show a prompt instead of the whole catalogue (that lives in the Công thức tab).
  const active = q.length > 0 || suitable;
  const recipes = useRecipes({ q, suitableForMe: suitable }, active);
  const items = active ? recipes.data?.pages.flatMap((page) => page.items) ?? [] : [];

  function toggleSuitable() {
    if (!token) {
      router.push({ pathname: '/login', params: { returnTo: '/explore' } });
      return;
    }
    setSuitableForMe((value) => !value);
  }

  return (
    <FlatList
      data={items}
      keyExtractor={(recipe) => recipe.id}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={[styles.list, styles.recipeList]}
      onEndReached={() => { if (recipes.hasNextPage && !recipes.isFetching && !recipes.isFetchNextPageError) void recipes.fetchNextPage(); }}
      onEndReachedThreshold={0.5}
      renderItem={({ item }) => <RecipeCard recipe={item} />}
      ListHeaderComponent={(
        <Pressable
          accessibilityRole="switch"
          accessibilityLabel="Chỉ món hợp với hồ sơ ăn uống của bạn"
          accessibilityState={{ checked: suitable }}
          onPress={toggleSuitable}
          style={[styles.filter, { backgroundColor: suitable ? theme.secondary : theme.card, borderColor: suitable ? theme.primary : theme.border }]}>
          <SymbolView name={{ ios: suitable ? 'checkmark' : 'leaf', android: suitable ? 'check' : 'eco', web: suitable ? 'check' : 'eco' }} size={16} tintColor={theme.primary} />
          <Text style={[styles.filterText, { color: theme.foreground }]}>Hợp với mình</Text>
        </Pressable>
      )}
      ListEmptyComponent={!active ? (
        <Text style={[styles.sub, styles.state, { color: theme.mutedForeground }]}>Nhập tên món hoặc nguyên liệu để tìm công thức.</Text>
      ) : recipes.isPending ? <ActivityIndicator color={theme.primary} style={styles.state} /> : recipes.isError ? (
        <Pressable accessibilityRole="button" onPress={() => void recipes.refetch()} style={styles.state}>
          <Text style={[styles.sub, { color: theme.destructive }]}>Không tìm được lúc này. Chạm để thử lại.</Text>
        </Pressable>
      ) : <Text style={[styles.sub, styles.state, { color: theme.mutedForeground }]}>{q ? `Không có công thức nào khớp “${q}”.` : 'Chưa có món hợp với hồ sơ của bạn.'}</Text>}
      ListFooterComponent={recipes.isFetchingNextPage ? <ActivityIndicator color={theme.primary} style={styles.state} /> : undefined}
    />
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { borderBottomWidth: 1, paddingHorizontal: Spacing.three },
  headerRow: { minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  back: { minWidth: 40, minHeight: 40, alignItems: 'center', justifyContent: 'center' },
  search: { flex: 1, minHeight: 42, borderWidth: 1, borderRadius: Radius.xl, flexDirection: 'row', alignItems: 'center', gap: Spacing.two, paddingHorizontal: Spacing.three },
  // Fills the bar's height and centres the text in it; Android's extra font padding otherwise pushes the placeholder off the icon's line.
  input: { flex: 1, minWidth: 0, height: 40, fontFamily: Fonts.sans, fontSize: 14, paddingVertical: 0, textAlignVertical: 'center', includeFontPadding: false },
  tabs: { flexDirection: 'row', gap: Spacing.four, paddingLeft: 40 + Spacing.two },
  tab: { minHeight: 44, justifyContent: 'center', borderBottomWidth: 2 },
  tabText: { fontFamily: Fonts.sansBold, fontSize: 14 },
  list: { width: '100%', maxWidth: 680, alignSelf: 'center' },
  recipeList: { paddingHorizontal: Spacing.three, paddingVertical: Spacing.three, gap: Spacing.three },
  filter: { alignSelf: 'flex-start', minHeight: 40, borderWidth: 1, borderRadius: 22, paddingHorizontal: Spacing.three, flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  filterText: { fontFamily: Fonts.sansSemibold, fontSize: 13 },
  state: { padding: Spacing.five, alignItems: 'center', textAlign: 'center' },
  sub: { fontFamily: Fonts.sans, fontSize: 14 },
});
