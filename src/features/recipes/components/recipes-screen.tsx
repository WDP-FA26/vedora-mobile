import { Image } from 'expo-image';
import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View, useWindowDimensions, type FlatListProps } from 'react-native';

import { BrandColors, Fonts, Radius, Spacing } from '@/constants/theme';
import { usePullToRefresh } from '@/hooks/use-pull-to-refresh';
import { useTheme } from '@/hooks/use-theme';
import { useSessionStore } from '@/shared/stores/session-store';

import { useRecipes } from '../hooks/use-recipes';
import { RecipeCard } from './recipe-card';

/** The recipe catalogue as the "Công thức" tab of the home feed; the feed supplies the header (whose search opens on recipes) and the safe area. */
export function RecipesList({ onScroll }: { onScroll?: FlatListProps<unknown>['onScroll'] }) {
  const theme = useTheme();
  const { width, fontScale } = useWindowDimensions();
  const columns = width < 360 || fontScale > 1.2 ? 1 : 2;
  const token = useSessionStore((state) => state.accessToken);
  const [suitableForMe, setSuitableForMe] = useState(false);
  const recipes = useRecipes({ q: '', suitableForMe: !!token && suitableForMe });
  const pull = usePullToRefresh(recipes.refetch);
  const items = recipes.data?.pages.flatMap((page) => page.items) ?? [];

  function toggleSuitable() {
    if (!token) {
      router.push({ pathname: '/login', params: { returnTo: '/explore' } });
      return;
    }
    setSuitableForMe((value) => !value);
  }

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <FlatList
        key={columns}
        numColumns={columns}
        columnWrapperStyle={columns === 2 ? styles.columns : undefined}
        data={items}
        onScroll={onScroll}
        scrollEventThrottle={16}
        keyExtractor={(item) => item.id}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.list}
        onEndReached={() => { if (recipes.hasNextPage && !recipes.isFetching && !recipes.isFetchNextPageError) void recipes.fetchNextPage(); }}
        onEndReachedThreshold={0.5}
        refreshing={pull.refreshing}
        onRefresh={pull.onRefresh}
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
            <View style={[styles.hero, { backgroundColor: BrandColors.forest }]}>
              <View style={styles.heroCopy}>
                <View style={styles.heroTag}><Text style={styles.eyebrow}>BẾP NHỎ VEDORA</Text></View>
                <Text style={styles.heroTitle}>Bếp xanh,{'\n'}bữa ngon.</Text>
                <Text style={styles.heroSub}>Chút cảm hứng cho bữa ăn hôm nay.</Text>
              </View>
              <View style={styles.stickerFrame} pointerEvents="none">
                <View style={styles.stickerCircle} />
                <Image source={require('@/assets/branding/carrot-sticker.png')} style={styles.heroSticker} contentFit="contain" accessible={false} />
                <Image source={require('@/assets/branding/avocado-sticker.png')} style={styles.friendSticker} contentFit="contain" accessible={false} />
              </View>
            </View>
            <Pressable accessibilityRole="button" accessibilityLabel="Tìm món ăn hoặc nguyên liệu" onPress={() => router.push({ pathname: '/search', params: { tab: 'recipes' } })} style={[styles.search, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <SymbolView name={{ ios: 'magnifyingglass', android: 'search', web: 'search' }} size={21} tintColor={theme.primary} />
              <Text style={[styles.searchText, { color: theme.mutedForeground }]}>Tìm món ăn, nguyên liệu…</Text>
              <SymbolView name={{ ios: 'arrow.right', android: 'arrow_forward', web: 'arrow_forward' }} size={18} tintColor={theme.primary} />
            </Pressable>
            <View style={styles.suggestions}>
              {['Nấm', 'Đậu hũ', 'Canh'].map((keyword) => (
                <Pressable key={keyword} accessibilityRole="button" accessibilityLabel={`Tìm công thức ${keyword}`} onPress={() => router.push({ pathname: '/search', params: { tab: 'recipes', q: keyword } })} style={[styles.suggestion, { backgroundColor: theme.card, borderColor: theme.border }]}>
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
              <Text accessibilityRole="header" style={[styles.sectionTitle, { color: theme.foreground }]}>{token && suitableForMe ? 'Món hợp với bạn' : 'Khám phá món ngon'}</Text>
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
            <Text style={[styles.emptyTitle, { color: theme.foreground }]}>{token && suitableForMe ? 'Chưa tìm thấy món phù hợp' : 'Chưa có công thức'}</Text>
            <Text style={[styles.sub, { color: theme.mutedForeground }]}>{token && suitableForMe ? 'Thử bỏ bộ lọc.' : 'Kho công thức hiện chưa có món nào.'}</Text>
          </View>
        )}
        ListFooterComponent={recipes.isFetchingNextPage ? <ActivityIndicator color={theme.primary} style={styles.state} /> : recipes.isError && items.length ? (
          <Pressable accessibilityRole="button" onPress={() => void (recipes.isFetchNextPageError ? recipes.fetchNextPage() : recipes.refetch())} style={styles.state}>
            <Text style={[styles.sub, { color: theme.destructive }]}>Chưa tải được thêm món. Chạm để thử lại.</Text>
          </Pressable>
        ) : undefined}
        renderItem={({ item }) => <View style={columns === 2 ? styles.gridItem : styles.singleItem}><RecipeCard recipe={item} /></View>}
      />
    </View>
  );
}


const styles = StyleSheet.create({
  screen: { flex: 1 },
  list: { width: '100%', maxWidth: 620, alignSelf: 'center', paddingHorizontal: Spacing.three, paddingBottom: Spacing.five, gap: Spacing.three },
  columns: { justifyContent: 'space-between' },
  gridItem: { width: '48.5%' },
  singleItem: { width: '100%' },
  header: { gap: Spacing.three },
  headingRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, paddingTop: Spacing.three },
  savedLink: { minHeight: 44, borderWidth: 1, borderRadius: Radius['4xl'], paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: Spacing.one },
  hero: { borderRadius: Radius['4xl'], padding: 20, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: Spacing.two, overflow: 'hidden' },
  heroCopy: { flexGrow: 1, flexShrink: 1, flexBasis: 150, gap: 12 },
  heroTag: { alignSelf: 'flex-start', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5, backgroundColor: BrandColors.cream },
  eyebrow: { fontFamily: Fonts.sansBold, fontSize: 10, letterSpacing: 1, color: BrandColors.forest },
  heroTitle: { fontFamily: Fonts.headingBold, fontSize: 28, lineHeight: 39, color: '#fffefa' },
  heroSub: { fontFamily: Fonts.sans, fontSize: 14, lineHeight: 21, color: '#e4f1dc' },
  stickerFrame: { width: 108, height: 150, justifyContent: 'center', alignItems: 'center' },
  stickerCircle: { width: 116, height: 116, borderRadius: 58, backgroundColor: '#ffffff12', position: 'absolute' },
  heroSticker: { width: 87, height: 132, alignSelf: 'flex-start', transform: [{ rotate: '-12deg' }] },
  friendSticker: { width: 72, height: 86, position: 'absolute', right: -12, bottom: 0, transform: [{ rotate: '12deg' }] },
  search: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 54, borderWidth: 1, borderRadius: Radius['2xl'], paddingHorizontal: Spacing.three, paddingVertical: Spacing.two },
  searchText: { flex: 1, fontFamily: Fonts.sans, fontSize: 15, lineHeight: 22 },
  suggestions: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  suggestion: { minHeight: 44, borderWidth: 1, borderRadius: 22, paddingHorizontal: Spacing.three, paddingVertical: Spacing.two, justifyContent: 'center' },
  filter: { minHeight: 72, borderWidth: 1, borderRadius: Radius['2xl'], padding: Spacing.three, flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  filterTitle: { fontFamily: Fonts.sansBold, fontSize: 15 },
  filterCheck: { width: 30, height: 30, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
  sectionRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, marginTop: Spacing.one },
  sectionTitle: { flex: 1, fontFamily: Fonts.headingBold, fontSize: 18, lineHeight: 27 },
  emptySticker: { width: 80, height: 80 },
  headingCopy: { flex: 1, minWidth: 0 },
  heading: { fontFamily: Fonts.headingBold, fontSize: 23, lineHeight: 31 },
  headingSub: { fontFamily: Fonts.sans, fontSize: 13, lineHeight: 18 },
  chipText: { fontFamily: Fonts.sansSemibold, fontSize: 13 },
  state: { padding: Spacing.five, textAlign: 'center' },
  sub: { fontFamily: Fonts.sans, fontSize: 13, lineHeight: 19 },
  empty: { borderWidth: 1, borderRadius: Radius['2xl'], padding: Spacing.four, alignItems: 'center', gap: Spacing.two },
  emptyTitle: { fontFamily: Fonts.headingBold, fontSize: 16, textAlign: 'center' },
});
