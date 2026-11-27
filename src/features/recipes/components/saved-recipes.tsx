import { Image } from 'expo-image';
import { router } from 'expo-router';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import { Fonts, Radius, Spacing } from '@/constants/theme';
import { usePullToRefresh } from '@/hooks/use-pull-to-refresh';
import { useTheme } from '@/hooks/use-theme';

import { useFavoriteRecipes } from '../hooks/use-recipes';
import { RecipeCard } from './recipe-card';

export function SavedRecipes() {
  const theme = useTheme();
  const { width, fontScale } = useWindowDimensions();
  const columns = width < 360 || fontScale > 1.2 ? 1 : 2;
  const recipes = useFavoriteRecipes();
  const pull = usePullToRefresh(recipes.refetch);
  const items = (recipes.data?.pages.flatMap((page) => page.items) ?? []).filter((recipe) => recipe.isFavorite);
  const retry = <Pressable accessibilityRole="button" onPress={() => void (recipes.isFetchNextPageError ? recipes.fetchNextPage() : recipes.refetch())} style={styles.state}>
    <Text style={[styles.text, { color: theme.destructive }]}>Chưa tải được công thức đã lưu. Chạm để thử lại.</Text>
  </Pressable>;
  return <FlatList
    key={columns} numColumns={columns} columnWrapperStyle={columns === 2 ? styles.columns : undefined}
    data={items} keyExtractor={(recipe) => recipe.id} contentContainerStyle={styles.list}
    refreshing={pull.refreshing} onRefresh={pull.onRefresh}
    onEndReached={() => { if (recipes.hasNextPage && !recipes.isFetching && !recipes.isFetchNextPageError) void recipes.fetchNextPage(); }}
    onEndReachedThreshold={0.5}
    ListHeaderComponent={<View style={[styles.banner, { backgroundColor: theme.secondary }]}>
      <View style={styles.bannerCopy}>
        <Text accessibilityRole="header" style={[styles.title, { color: theme.foreground }]}>Góc món yêu thích</Text>
        <Text style={[styles.sub, { color: theme.mutedForeground }]}>Lưu chút cảm hứng, để dành lần vào bếp tới.</Text>
      </View>
      <Image source={require('@/assets/branding/tomato-sticker.png')} style={styles.sticker} contentFit="contain" accessible={false} />
    </View>}
    renderItem={({ item }) => <View style={columns === 2 ? styles.gridItem : styles.singleItem}><RecipeCard recipe={item} /></View>}
    ListEmptyComponent={recipes.isPending ? <ActivityIndicator color={theme.primary} style={styles.state} /> : recipes.isError ? retry : <View style={[styles.empty, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <Image source={require('@/assets/branding/avocado-sticker.png')} style={styles.emptySticker} contentFit="contain" accessible={false} />
      <Text style={[styles.title, { color: theme.foreground }]}>Chưa có món đã lưu</Text>
      <Text style={[styles.text, { color: theme.mutedForeground }]}>Chạm “Lưu công thức” ở món bạn thích để tìm lại tại đây.</Text>
      <Pressable accessibilityRole="button" onPress={() => router.push({ pathname: '/search', params: { tab: 'recipes' } })} style={[styles.action, { backgroundColor: theme.primary }]}>
        <Text style={[styles.actionText, { color: theme.primaryForeground }]}>Tìm món để lưu</Text>
      </Pressable>
    </View>}
    ListFooterComponent={recipes.isFetchingNextPage ? <ActivityIndicator color={theme.primary} style={styles.state} /> : recipes.isError && items.length ? retry : undefined}
  />;
}

const styles = StyleSheet.create({
  list: { width: '100%', maxWidth: 620, alignSelf: 'center', padding: Spacing.three, gap: Spacing.three, paddingBottom: Spacing.five },
  columns: { justifyContent: 'space-between' },
  gridItem: { width: '48.5%' },
  singleItem: { width: '100%' },
  banner: { borderRadius: Radius['3xl'], padding: Spacing.three, flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  bannerCopy: { flex: 1, gap: 6 },
  title: { fontFamily: Fonts.headingBold, fontSize: 18, lineHeight: 27, textAlign: 'left' },
  sub: { fontFamily: Fonts.sans, fontSize: 14, lineHeight: 21 },
  sticker: { width: 64, height: 78, transform: [{ rotate: '8deg' }] },
  empty: { alignItems: 'center', borderWidth: 1, borderRadius: Radius['3xl'], padding: Spacing.four, gap: 12 },
  emptySticker: { width: 90, height: 100 },
  action: { minHeight: 48, justifyContent: 'center', borderRadius: Radius['4xl'], paddingHorizontal: Spacing.four, paddingVertical: Spacing.two, marginTop: Spacing.two },
  actionText: { fontFamily: Fonts.sansBold, fontSize: 14, textAlign: 'center' },
  state: { padding: Spacing.four },
  text: { fontFamily: Fonts.sans, fontSize: 14, lineHeight: 22, textAlign: 'center' },
});
