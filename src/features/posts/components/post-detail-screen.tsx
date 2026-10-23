import { router, useLocalSearchParams } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Fonts, Radius, Spacing } from '@/constants/theme';
import { PostCard } from '@/features/feed/components/post-card';
import { useTheme } from '@/hooks/use-theme';
import { ApiError } from '@/shared/api/api-error';

import { useCommentDraft } from '../hooks/use-comment-draft';
import { usePost } from '../hooks/use-posts';
import { CommentComposer, CommentList } from './comment-section';

export function PostDetailScreen() {
  const theme = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const post = usePost(id);
  const draft = useCommentDraft(id, post.data?.commentCount ?? 0);
  const notFound = post.error instanceof ApiError && post.error.status === 404;

  return (
    <SafeAreaView edges={['top']} style={[styles.screen, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.background, borderBottomColor: theme.border }]}>
        <Pressable accessibilityRole="button" accessibilityLabel="Quay lại" onPress={() => (router.canGoBack() ? router.back() : router.replace('/explore'))} hitSlop={10} style={styles.back}>
          <SymbolView name={{ ios: 'chevron.left', android: 'arrow_back', web: 'arrow_back' }} size={22} tintColor={theme.foreground} />
        </Pressable>
        <Text style={[styles.title, { color: theme.foreground }]}>Bài viết</Text>
      </View>
      <KeyboardAvoidingView style={styles.screen} behavior="padding" enabled={Platform.OS !== 'web'}>
      <ScrollView style={styles.screen} keyboardShouldPersistTaps="handled" keyboardDismissMode="interactive" contentContainerStyle={styles.content}>
        {post.isPending ? <ActivityIndicator color={theme.primary} style={styles.loading} /> : null}
        {post.isError ? (
          <View style={styles.state}>
            <Text style={[styles.stateTitle, { color: theme.foreground }]}>{notFound ? 'Bài viết không còn tồn tại' : 'Chưa tải được bài viết'}</Text>
            {!notFound ? (
              <Pressable accessibilityRole="button" onPress={() => void post.refetch()} style={[styles.retry, { borderColor: theme.border }]}>
                <Text style={[styles.retryText, { color: theme.primary }]}>Thử lại</Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}
        {post.data ? (
          <>
            <PostCard post={post.data} visible detail />
            <CommentList postId={post.data.id} postAuthorId={post.data.author.id} commentCount={post.data.commentCount} draft={draft} />
          </>
        ) : null}
      </ScrollView>
      {post.data ? <CommentComposer draft={draft} /> : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { minHeight: 52, flexDirection: 'row', alignItems: 'center', gap: Spacing.two, paddingHorizontal: Spacing.three, borderBottomWidth: 1 },
  back: { minWidth: 40, minHeight: 40, alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: Fonts.headingBold, fontSize: 18 },
  content: { width: '100%', maxWidth: 680, alignSelf: 'center', paddingBottom: Spacing.five },
  loading: { padding: Spacing.five },
  state: { padding: Spacing.four, alignItems: 'center', gap: Spacing.three },
  stateTitle: { fontFamily: Fonts.headingBold, fontSize: 17, textAlign: 'center' },
  retry: { minHeight: 42, borderWidth: 1, borderRadius: Radius.xl, paddingHorizontal: Spacing.four, alignItems: 'center', justifyContent: 'center' },
  retryText: { fontFamily: Fonts.sansSemibold, fontSize: 14 },
});
