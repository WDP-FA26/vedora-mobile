import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text } from 'react-native';

import { Fonts, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { useFavoriteRecipes } from '../hooks/use-recipes';
import { RecipeCard } from './recipe-card';

export function SavedRecipes() {
  const theme = useTheme();
  const recipes = useFavoriteRecipes();
  const items = (recipes.data?.pages.flatMap((page) => page.items) ?? []).filter((recipe) => recipe.isFavorite);
  const retry = <Pressable accessibilityRole="button" onPress={() => void (recipes.isFetchNextPageError ? recipes.fetchNextPage() : recipes.refetch())} style={styles.state}>
    <Text style={[styles.text, { color: theme.destructive }]}>Chưa tải được công thức đã lưu. Chạm để thử lại.</Text>
  </Pressable>;
  return <FlatList
    data={items} keyExtractor={(recipe) => recipe.id} contentContainerStyle={styles.list}
    refreshing={recipes.isRefetching} onRefresh={() => void recipes.refetch()}
    onEndReached={() => { if (recipes.hasNextPage && !recipes.isFetching && !recipes.isFetchNextPageError) void recipes.fetchNextPage(); }}
    onEndReachedThreshold={0.5}
    renderItem={({ item }) => <RecipeCard recipe={item} />}
    ListEmptyComponent={recipes.isPending ? <ActivityIndicator color={theme.primary} style={styles.state} /> : recipes.isError ? retry : <Text style={[styles.text, styles.state, { color: theme.mutedForeground }]}>Chưa có công thức đã lưu. Bấm Lưu ở món bạn thích để tìm lại tại đây.</Text>}
    ListFooterComponent={recipes.isFetchingNextPage ? <ActivityIndicator color={theme.primary} style={styles.state} /> : recipes.isError && items.length ? retry : undefined}
  />;
}

const styles = StyleSheet.create({
  list: { width: '100%', maxWidth: 620, alignSelf: 'center', padding: Spacing.three, gap: Spacing.three, paddingBottom: Spacing.five },
  state: { padding: Spacing.four },
  text: { fontFamily: Fonts.sans, fontSize: 14, lineHeight: 22, textAlign: 'center' },
});
