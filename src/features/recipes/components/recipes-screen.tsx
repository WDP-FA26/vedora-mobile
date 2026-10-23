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
import { MAX_RECIPE_QUERY_LENGTH, type Recipe } from '../types/recipe.schema';
import { recipeMinutes } from '../utils/recipe-format';

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
      router.push({ pathname: '/login', params: { returnTo: '/ai' } });
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
        onEndReached={() => { if (recipes.hasNextPage && !recipes.isFetchingNextPage) void recipes.fetchNextPage(); }}
        onEndReachedThreshold={0.5}
        ListHeaderComponent={(
          <View style={styles.header}>
            <View style={styles.headingRow}>
              <View style={[styles.headingIcon, { backgroundColor: theme.secondary }]}>
                <SymbolView name={{ ios: 'book.closed', android: 'menu_book', web: 'menu_book' }} size={23} tintColor={theme.primary} />
              </View>
              <View style={styles.headingCopy}>
                <Text accessibilityRole="header" style={[styles.heading, { color: theme.foreground }]}>Công thức</Text>
                <Text style={[styles.headingSub, { color: theme.mutedForeground }]}>Khám phá món chay trong kho công thức Vedora</Text>
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
            <Pressable
              accessibilityRole="switch"
              accessibilityState={{ checked: !!token && suitableForMe }}
              onPress={toggleSuitable}
              style={[styles.chip, { backgroundColor: token && suitableForMe ? theme.primary : theme.card, borderColor: token && suitableForMe ? theme.primary : theme.border }]}
            >
              <Text style={[styles.chipText, { color: token && suitableForMe ? theme.primaryForeground : theme.foreground }]}>Hợp với hồ sơ ăn uống của tôi</Text>
            </Pressable>
          </View>
        )}
        ListEmptyComponent={recipes.isPending ? <ActivityIndicator color={theme.primary} style={styles.state} /> : recipes.isError ? (
          <Pressable accessibilityRole="button" onPress={() => void recipes.refetch()} style={styles.state}>
            <Text style={[styles.sub, { color: theme.destructive }]}>Không tải được công thức. Chạm để thử lại.</Text>
          </Pressable>
        ) : (
          <View style={[styles.empty, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <SymbolView name={{ ios: 'fork.knife', android: 'restaurant', web: 'restaurant' }} size={28} tintColor={theme.primary} />
            <Text style={[styles.emptyTitle, { color: theme.foreground }]}>{q || suitableForMe ? 'Chưa tìm thấy món phù hợp' : 'Chưa có công thức'}</Text>
            <Text style={[styles.sub, { color: theme.mutedForeground }]}>{q || suitableForMe ? 'Thử từ khóa khác hoặc bỏ bộ lọc.' : 'Kho công thức hiện chưa có món nào.'}</Text>
          </View>
        )}
        ListFooterComponent={recipes.isFetchingNextPage ? <ActivityIndicator color={theme.primary} style={styles.state} /> : null}
        renderItem={({ item }) => <RecipeCard recipe={item} />}
      />
    </SafeAreaView>
  );
}

function RecipeCard({ recipe }: { recipe: Recipe }) {
  const theme = useTheme();
  const minutes = recipeMinutes(recipe);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Xem công thức ${recipe.title}`}
      onPress={() => router.push({ pathname: '/recipes/[id]', params: { id: recipe.id } })}
      style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}
    >
      {recipe.imageUrl ? (
        <Image source={{ uri: recipe.imageUrl }} style={styles.image} contentFit="cover" />
      ) : (
        <View style={[styles.image, styles.imageEmpty, { backgroundColor: theme.secondary }]}>
          <SymbolView name={{ ios: 'fork.knife', android: 'restaurant', web: 'restaurant' }} size={30} tintColor={theme.primary} />
        </View>
      )}
      <View style={styles.cardCopy}>
        <Text style={[styles.cardTitle, { color: theme.foreground }]}>{recipe.title}</Text>
        <Text style={[styles.sub, { color: theme.mutedForeground }]}>
          {[minutes !== null ? `${minutes} phút` : null, `${recipe.servings} khẩu phần`, `${recipe.ingredientCount} nguyên liệu`].filter(Boolean).join(' · ')}
        </Text>
        {recipe.conflicts.length > 0 ? (
          <Text style={[styles.warning, { color: theme.destructive }]}>{recipe.conflicts.length} cảnh báo kết hợp nguyên liệu</Text>
        ) : null}
        {recipe.post ? <Text style={[styles.sub, { color: theme.mutedForeground }]}>Bởi {recipe.post.author.fullName}</Text> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  list: { width: '100%', maxWidth: 620, alignSelf: 'center', paddingHorizontal: Spacing.three, paddingBottom: Spacing.five, gap: Spacing.three },
  header: { gap: Spacing.three },
  headingRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, paddingTop: Spacing.three },
  headingIcon: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
  headingCopy: { flex: 1, minWidth: 0 },
  heading: { fontFamily: Fonts.headingBold, fontSize: 23, lineHeight: 31 },
  headingSub: { fontFamily: Fonts.sans, fontSize: 13, lineHeight: 18 },
  search: { minHeight: 48, borderWidth: 1, borderRadius: Radius.xl, flexDirection: 'row', alignItems: 'center', gap: Spacing.two, paddingLeft: Spacing.three, paddingRight: Spacing.two },
  searchInput: { flex: 1, minWidth: 0, minHeight: 46, fontFamily: Fonts.sans, fontSize: 14, paddingVertical: 0 },
  clear: { minWidth: 36, minHeight: 36, alignItems: 'center', justifyContent: 'center' },
  chip: { alignSelf: 'flex-start', minHeight: 37, borderRadius: 20, borderWidth: 1, paddingHorizontal: Spacing.three, alignItems: 'center', justifyContent: 'center' },
  chipText: { fontFamily: Fonts.sansSemibold, fontSize: 13 },
  state: { padding: Spacing.five, textAlign: 'center' },
  sub: { fontFamily: Fonts.sans, fontSize: 13, lineHeight: 19 },
  empty: { borderWidth: 1, borderRadius: Radius['2xl'], padding: Spacing.four, alignItems: 'center', gap: Spacing.two },
  emptyTitle: { fontFamily: Fonts.headingBold, fontSize: 16, textAlign: 'center' },
  card: { borderWidth: 1, borderRadius: Radius['2xl'], overflow: 'hidden' },
  image: { width: '100%', height: 160 },
  imageEmpty: { alignItems: 'center', justifyContent: 'center' },
  cardCopy: { padding: Spacing.three, gap: Spacing.one },
  cardTitle: { fontFamily: Fonts.headingBold, fontSize: 17, lineHeight: 24 },
  warning: { fontFamily: Fonts.sansSemibold, fontSize: 12 },
});
