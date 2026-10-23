import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Fonts, Radius, Spacing } from '@/constants/theme';
import { PostCard } from '@/features/feed/components/post-card';
import { useTheme } from '@/hooks/use-theme';

import { usePostSearch } from '../hooks/use-posts';
import { MAX_SEARCH_QUERY_LENGTH } from '../types/posts.schema';

export function SearchScreen() {
  const theme = useTheme();
  const [text, setText] = useState('');
  const [q, setQ] = useState('');
  const search = usePostSearch(q);
  const posts = search.data?.pages.flatMap((page) => page.items).filter((post) => post.status === 'PUBLISHED') ?? [];

  useEffect(() => {
    const timer = setTimeout(() => setQ(text.trim()), 350);
    return () => clearTimeout(timer);
  }, [text]);

  return (
    <SafeAreaView edges={['top']} style={[styles.screen, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
        <Pressable accessibilityRole="button" accessibilityLabel="Quay lại" onPress={() => (router.canGoBack() ? router.back() : router.replace('/explore'))} hitSlop={10} style={styles.back}>
          <SymbolView name={{ ios: 'chevron.left', android: 'arrow_back', web: 'arrow_back' }} size={22} tintColor={theme.foreground} />
        </Pressable>
        <View style={[styles.search, { backgroundColor: theme.background, borderColor: theme.border }]}>
          <SymbolView name={{ ios: 'magnifyingglass', android: 'search', web: 'search' }} size={18} tintColor={theme.mutedForeground} />
          <TextInput
            accessibilityLabel="Tìm bài viết"
            autoFocus
            value={text}
            onChangeText={setText}
            maxLength={MAX_SEARCH_QUERY_LENGTH}
            placeholder="Tìm bài viết..."
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
        ListFooterComponent={search.isFetchingNextPage ? <ActivityIndicator color={theme.primary} style={styles.state} /> : null}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: Spacing.two, paddingHorizontal: Spacing.three, borderBottomWidth: 1 },
  back: { minWidth: 40, minHeight: 40, alignItems: 'center', justifyContent: 'center' },
  search: { flex: 1, minHeight: 42, borderWidth: 1, borderRadius: Radius.xl, flexDirection: 'row', alignItems: 'center', gap: Spacing.two, paddingHorizontal: Spacing.three },
  input: { flex: 1, minWidth: 0, fontFamily: Fonts.sans, fontSize: 14, paddingVertical: 0 },
  list: { width: '100%', maxWidth: 680, alignSelf: 'center' },
  state: { padding: Spacing.five, alignItems: 'center', textAlign: 'center' },
  sub: { fontFamily: Fonts.sans, fontSize: 14 },
});
