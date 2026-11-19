import { ActivityIndicator, Pressable, StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';

import { Fonts, Spacing } from '@/constants/theme';
import { PostCard } from '@/features/feed/components/post-card';
import type { FeedPost } from '@/features/feed/types/feed.schema';
import { useTheme } from '@/hooks/use-theme';

import type { useProfileReposts } from '../hooks/use-profile';

/** Render as direct children of the profile ScrollView so post geometry stays in content coordinates. */
export function ProfileReposts({ query, ownerName, onPostLayout }: {
  query: ReturnType<typeof useProfileReposts>;
  ownerName: string;
  onPostLayout: (post: FeedPost) => (event: LayoutChangeEvent) => void;
}) {
  const theme = useTheme();
  const posts = [...new Map(query.data?.pages.flatMap((page) => page.items).map((post) => [post.id, post])).values()];
  return (
    <>
      <Text style={[styles.note, { color: theme.mutedForeground }]}>{ownerName} đã đăng lại · Nội dung từ tác giả gốc</Text>
      {query.isPending ? <ActivityIndicator color={theme.primary} style={styles.state} /> : null}
      {query.isError && !query.isFetchNextPageError ? (
        <Pressable accessibilityRole="button" onPress={() => void query.refetch()} style={styles.state}>
          <Text style={[styles.text, { color: theme.destructive }]}>Không tải được bài đăng lại. Chạm để thử lại.</Text>
        </Pressable>
      ) : null}
      {posts.map((post) => <PostCard key={post.id} post={post} visible onLayout={onPostLayout(post)} />)}
      {!query.isPending && !query.isError && !posts.length && !query.hasNextPage ? (
        <Text style={[styles.state, styles.text, { color: theme.mutedForeground }]}>Chưa có bài đăng lại công khai.</Text>
      ) : null}
      {query.hasNextPage ? (
        <View style={styles.state}>
          {query.isFetchNextPageError ? <Text style={[styles.text, { color: theme.destructive }]}>Chưa tải được trang tiếp theo.</Text> : null}
          <Pressable accessibilityRole="button" disabled={query.isFetching} onPress={() => void query.fetchNextPage()} style={styles.button}>
            {query.isFetching ? <ActivityIndicator color={theme.primary} /> : <Text style={[styles.text, { color: theme.primary }]}>{query.isFetchNextPageError ? 'Thử lại' : 'Tải thêm bài đăng lại'}</Text>}
          </Pressable>
        </View>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  note: { fontFamily: Fonts.sans, fontSize: 13, lineHeight: 19, paddingHorizontal: Spacing.three, paddingVertical: Spacing.two },
  text: { fontFamily: Fonts.sansSemibold, fontSize: 14, textAlign: 'center' },
  state: { padding: Spacing.three, alignItems: 'center', gap: Spacing.two },
  button: { minHeight: 44, justifyContent: 'center', paddingHorizontal: Spacing.three },
});
