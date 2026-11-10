import { Image } from 'expo-image';
import { router } from 'expo-router';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Fonts, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useSessionStore } from '@/shared/stores/session-store';

import { useMyBlogs } from '../hooks/use-my-blogs';
import { plainText } from '../utils/markdown';

export function MyBlogsScreen({ embedded = false }: { embedded?: boolean }) {
  const theme = useTheme();
  const token = useSessionStore((state) => state.accessToken);
  const blogs = useMyBlogs();
  const items = blogs.data?.pages.flatMap((page) => page.items) ?? [];
  const Container = embedded ? View : SafeAreaView;
  const renderBlog = (item: (typeof items)[number]) => (
    <Pressable key={item.id} accessibilityRole="button" accessibilityLabel={`Chỉnh sửa ${item.blog.title}`} onPress={() => router.push({ pathname: '/blogs/[id]/edit', params: { id: item.id } })} style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
      {item.blog.coverImageUrl ? <Image source={{ uri: item.blog.coverImageUrl }} style={styles.cover} contentFit="cover" /> : null}
      <View style={styles.cardCopy}>
        <Text style={[styles.badge, { color: theme.primary }]}>{item.status === 'PUBLISHED' ? 'Đã đăng' : 'Bản nháp'}</Text>
        <Text style={[styles.emptyTitle, { color: theme.foreground }]}>{item.blog.title}</Text>
        {item.blog.excerpt ? <Text numberOfLines={2} style={[styles.copy, { color: theme.mutedForeground }]}>{plainText(item.blog.excerpt)}</Text> : null}
        <Text style={[styles.date, { color: theme.mutedForeground }]}>{new Date(item.createdAt).toLocaleDateString('vi-VN')} · Chạm để chỉnh sửa</Text>
      </View>
    </Pressable>
  );
  const empty = <View style={styles.state}>
    {blogs.isPending ? <ActivityIndicator color={theme.primary} /> : blogs.isError ? <>
      <Text style={[styles.copy, { color: theme.destructive }]}>Không tải được danh sách blog.</Text>
      <Pressable accessibilityRole="button" onPress={() => void blogs.refetch()} style={styles.back}><Text style={{ color: theme.primary }}>Thử lại</Text></Pressable>
    </> : <>
      <Text style={[styles.emptyTitle, { color: theme.foreground }]}>Bắt đầu câu chuyện bếp chay của bạn</Text>
      <Text style={[styles.copy, { color: theme.mutedForeground }]}>Bạn chưa có blog nào. Bấm “Viết blog” để tạo bài đầu tiên.</Text>
    </>}
  </View>;
  return (
    <Container style={[!embedded && styles.screen, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { borderColor: theme.border }]}>
        {!embedded ? <Pressable accessibilityRole="button" accessibilityLabel="Quay lại" onPress={() => router.canGoBack() ? router.back() : router.replace('/me')} style={styles.back}>
          <Text style={[styles.action, { color: theme.primary }]}>‹</Text>
        </Pressable> : null}
        <Text style={[styles.heading, { color: theme.foreground }]}>Blog của tôi</Text>
        {token ? <Pressable accessibilityRole="button" onPress={() => router.push('/blogs/new')} style={[styles.write, { backgroundColor: theme.primary }]}>
          <Text style={[styles.buttonText, { color: theme.primaryForeground }]}>Viết blog</Text>
        </Pressable> : null}
      </View>
      {!token ? <View style={styles.state}>
        <Text style={[styles.copy, { color: theme.foreground }]}>Đăng nhập để viết và quản lý blog của bạn.</Text>
        <Pressable accessibilityRole="button" onPress={() => router.push({ pathname: '/login', params: { returnTo: '/blogs' } })} style={styles.back}>
          <Text style={[styles.buttonText, { color: theme.primary }]}>Đăng nhập</Text>
        </Pressable>
      </View> : embedded ? <View style={styles.list}>
        <Pressable accessibilityRole="button" disabled={blogs.isFetching} onPress={() => void blogs.refetch()} style={styles.back}>
          <Text style={[styles.buttonText, { color: theme.primary }]}>{blogs.isRefetching ? 'Đang tải…' : 'Tải lại danh sách'}</Text>
        </Pressable>
        {items.length ? items.map(renderBlog) : empty}
        {blogs.hasNextPage ? <Pressable accessibilityRole="button" disabled={blogs.isFetching} onPress={() => void blogs.fetchNextPage()} style={styles.back}>
          <Text style={[styles.buttonText, { color: blogs.isFetchNextPageError ? theme.destructive : theme.primary }]}>{blogs.isFetchingNextPage ? 'Đang tải…' : blogs.isFetchNextPageError ? 'Tải thêm thất bại. Thử lại' : 'Xem thêm blog'}</Text>
        </Pressable> : null}
      </View> : <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshing={blogs.isRefetching && !blogs.isFetchingNextPage}
        onRefresh={() => void blogs.refetch()}
        onEndReached={() => { if (blogs.hasNextPage && !blogs.isFetchingNextPage) void blogs.fetchNextPage(); }}
        onEndReachedThreshold={0.4}
        ListEmptyComponent={empty}
        ListFooterComponent={blogs.isFetchingNextPage ? <ActivityIndicator color={theme.primary} /> : blogs.isFetchNextPageError ? <Pressable accessibilityRole="button" onPress={() => void blogs.fetchNextPage()} style={styles.state}><Text style={{ color: theme.destructive }}>Chưa tải được thêm bài. Chạm để thử lại.</Text></Pressable> : undefined}
        renderItem={({ item }) => renderBlog(item)}
      />}
    </Container>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.three, minHeight: 64, borderBottomWidth: 1, gap: Spacing.two },
  back: { minHeight: 44, minWidth: 44, justifyContent: 'center', alignItems: 'center' },
  action: { fontSize: 34 },
  heading: { flex: 1, fontFamily: Fonts.headingBold, fontSize: 21 },
  write: { paddingHorizontal: 16, minHeight: 44, justifyContent: 'center', borderRadius: Radius.xl },
  buttonText: { fontFamily: Fonts.sansBold, fontSize: 14 },
  list: { width: '100%', maxWidth: 680, alignSelf: 'center', padding: Spacing.three, gap: Spacing.three },
  state: { padding: Spacing.four, alignItems: 'center', gap: Spacing.three },
  copy: { fontFamily: Fonts.sans, fontSize: 15, lineHeight: 22 },
  emptyTitle: { fontFamily: Fonts.headingBold, fontSize: 18, lineHeight: 25 },
  card: { borderWidth: 1, borderRadius: Radius['2xl'], overflow: 'hidden' },
  cover: { height: 150, width: '100%' },
  cardCopy: { padding: Spacing.three, gap: Spacing.two },
  badge: { fontFamily: Fonts.sansBold, fontSize: 13 },
  date: { fontFamily: Fonts.sans, fontSize: 12 },
});
