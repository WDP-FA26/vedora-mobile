import { router, useLocalSearchParams } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Fonts, Radius, Spacing } from '@/constants/theme';
import { PostCard } from '@/features/feed/components/post-card';
import { SavedRecipes } from '@/features/recipes/components/saved-recipes';
import { useTheme } from '@/hooks/use-theme';
import { useSessionStore } from '@/shared/stores/session-store';

import { useBookmarks } from '../hooks/use-posts';

/** Saved posts and recipes, each with its own paginated list. */
export function BookmarksScreen() {
  const theme = useTheme();
  const { tab: initialTab } = useLocalSearchParams<{ tab?: string }>();
  const [tab, setTab] = useState<'posts' | 'recipes'>(initialTab === 'recipes' ? 'recipes' : 'posts');
  const token = useSessionStore((state) => state.accessToken);
  const bookmarks = useBookmarks();
  const posts = (bookmarks.data?.pages.flatMap((page) => page.items) ?? []).filter((post) => post.isBookmarked);

  return (
    <SafeAreaView edges={['top']} style={[styles.screen, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.background, borderBottomColor: theme.border }]}>
        <Pressable accessibilityRole="button" accessibilityLabel="Quay lại" onPress={() => (router.canGoBack() ? router.back() : router.replace('/me'))} hitSlop={10} style={styles.back}>
          <SymbolView name={{ ios: 'chevron.left', android: 'arrow_back', web: 'arrow_back' }} size={22} tintColor={theme.foreground} />
        </Pressable>
        <Text style={[styles.title, { color: theme.foreground }]}>Đã lưu</Text>
      </View>
      <View accessibilityRole="tablist" style={styles.tabs}>
        {([{ key: 'posts', label: 'Bài viết' }, { key: 'recipes', label: 'Công thức' }] as const).map(({ key, label }) => (
          <Pressable key={key} accessibilityRole="tab" accessibilityState={{ selected: tab === key }} onPress={() => setTab(key)} style={[styles.tab, { backgroundColor: tab === key ? theme.primary : theme.secondary }]}>
            <Text style={[styles.loginText, { color: tab === key ? theme.primaryForeground : theme.foreground }]}>{label}</Text>
          </Pressable>
        ))}
      </View>
      {!token ? (
        <View style={styles.state}>
          <Text style={[styles.sub, { color: theme.mutedForeground }]}>Đăng nhập để xem bài viết và công thức đã lưu.</Text>
          <Pressable accessibilityRole="button" onPress={() => router.push({ pathname: '/login', params: { returnTo: '/bookmarks' } })} style={[styles.login, { backgroundColor: theme.primary }]}>
            <Text style={[styles.loginText, { color: theme.primaryForeground }]}>Đăng nhập</Text>
          </Pressable>
        </View>
      ) : tab === 'recipes' ? <SavedRecipes /> : (
        <FlatList
          data={posts}
          keyExtractor={(post) => post.id}
          contentContainerStyle={styles.list}
          onEndReached={() => { if (bookmarks.hasNextPage && !bookmarks.isFetchingNextPage) void bookmarks.fetchNextPage(); }}
          onEndReachedThreshold={0.5}
          renderItem={({ item }) => <PostCard post={item} visible={false} />}
          ListEmptyComponent={bookmarks.isPending ? <ActivityIndicator color={theme.primary} style={styles.state} /> : bookmarks.isError ? (
            <Pressable accessibilityRole="button" onPress={() => void bookmarks.refetch()} style={styles.state}>
              <Text style={[styles.sub, { color: theme.destructive }]}>Không tải được bài đã lưu. Chạm để thử lại.</Text>
            </Pressable>
          ) : <Text style={[styles.sub, styles.state, { color: theme.mutedForeground }]}>Bạn chưa lưu bài viết nào.</Text>}
          ListFooterComponent={bookmarks.isFetchingNextPage ? <ActivityIndicator color={theme.primary} style={styles.state} /> : undefined}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  tabs: { flexDirection: 'row', gap: Spacing.two, padding: Spacing.three },
  tab: { flex: 1, minHeight: 44, borderRadius: Radius.xl, alignItems: 'center', justifyContent: 'center', padding: Spacing.two },
  header: { minHeight: 52, flexDirection: 'row', alignItems: 'center', gap: Spacing.two, paddingHorizontal: Spacing.three, borderBottomWidth: 1 },
  back: { minWidth: 40, minHeight: 40, alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: Fonts.headingBold, fontSize: 18 },
  list: { width: '100%', maxWidth: 680, alignSelf: 'center' },
  state: { padding: Spacing.five, alignItems: 'center', gap: Spacing.three, textAlign: 'center' },
  sub: { fontFamily: Fonts.sans, fontSize: 14 },
  login: { minHeight: 44, borderRadius: Radius.xl, paddingHorizontal: Spacing.four, alignItems: 'center', justifyContent: 'center' },
  loginText: { fontFamily: Fonts.sansBold, fontSize: 14 },
});
