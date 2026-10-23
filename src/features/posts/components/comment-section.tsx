import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Fonts, Radius, Spacing } from '@/constants/theme';
import { useMyProfile } from '@/features/profile/hooks/use-profile';
import { useTheme } from '@/hooks/use-theme';
import { useSessionStore } from '@/shared/stores/session-store';

import { useCommentActions, useComments } from '../hooks/use-posts';
import { MAX_COMMENT_LENGTH, commentFormSchema, type Comment } from '../types/posts.schema';

function formatTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('vi-VN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(date);
}

function confirmDelete(onConfirm: () => void) {
  if (Platform.OS === 'web') {
    if (window.confirm('Xóa bình luận này?')) onConfirm();
    return;
  }
  Alert.alert('Xóa bình luận?', 'Bình luận sẽ bị xóa vĩnh viễn.', [
    { text: 'Hủy', style: 'cancel' },
    { text: 'Xóa', style: 'destructive', onPress: onConfirm },
  ]);
}

/** Only the comment author may edit; the comment author or the post author may delete (`DELETE /posts/:id/comments/:commentId`). */
export function CommentSection({ postId, postAuthorId, commentCount }: { postId: string; postAuthorId: string; commentCount: number }) {
  const theme = useTheme();
  const token = useSessionStore((state) => state.accessToken);
  const me = useMyProfile(token);
  const comments = useComments(postId);
  const actions = useCommentActions(postId, commentCount);
  const [draft, setDraft] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const items: Comment[] = comments.data?.pages.flatMap((page) => page.items) ?? [];

  async function submit() {
    if (!token) {
      router.push({ pathname: '/login', params: { returnTo: '/explore' } });
      return;
    }
    const parsed = commentFormSchema.safeParse({ body: draft });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Bình luận chưa hợp lệ.');
      return;
    }
    setError('');
    try {
      if (editingId) await actions.edit.mutateAsync({ commentId: editingId, body: parsed.data.body });
      else await actions.add.mutateAsync(parsed.data.body);
      setDraft('');
      setEditingId(null);
    } catch {
      setError('Chưa gửi được bình luận. Nội dung vẫn được giữ để bạn thử lại.');
    }
  }

  const pending = actions.add.isPending || actions.edit.isPending;

  return (
    <View style={[styles.section, { backgroundColor: theme.card, borderTopColor: theme.border }]}>
      <Text style={[styles.title, { color: theme.foreground }]}>Bình luận ({commentCount})</Text>
      {token ? (
        <View style={styles.composer}>
          {editingId ? <Text style={[styles.hint, { color: theme.primary }]}>Đang sửa bình luận</Text> : null}
          <TextInput
            accessibilityLabel="Viết bình luận"
            value={draft}
            onChangeText={setDraft}
            maxLength={MAX_COMMENT_LENGTH}
            multiline
            placeholder="Viết bình luận…"
            placeholderTextColor={theme.mutedForeground}
            style={[styles.input, { color: theme.foreground, borderColor: theme.border }]}
          />
          {error ? <Text accessibilityRole="alert" style={[styles.hint, { color: theme.destructive }]}>{error}</Text> : null}
          <View style={styles.composerActions}>
            {editingId ? (
              <Pressable accessibilityRole="button" onPress={() => { setEditingId(null); setDraft(''); setError(''); }}>
                <Text style={[styles.action, { color: theme.mutedForeground }]}>Hủy sửa</Text>
              </Pressable>
            ) : null}
            <Pressable accessibilityRole="button" disabled={pending} onPress={() => void submit()} style={[styles.send, { backgroundColor: theme.primary, opacity: pending ? 0.6 : 1 }]}>
              <Text style={[styles.sendText, { color: theme.primaryForeground }]}>{pending ? 'Đang gửi…' : editingId ? 'Lưu' : 'Gửi'}</Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <Pressable accessibilityRole="button" onPress={() => router.push({ pathname: '/login', params: { returnTo: '/explore' } })} style={[styles.loginPrompt, { borderColor: theme.border }]}>
          <Text style={[styles.action, { color: theme.primary }]}>Đăng nhập để bình luận</Text>
        </Pressable>
      )}

      {comments.isPending ? <ActivityIndicator color={theme.primary} style={styles.loading} /> : null}
      {comments.isError ? (
        <Pressable accessibilityRole="button" onPress={() => void comments.refetch()}>
          <Text style={[styles.hint, { color: theme.destructive }]}>Không tải được bình luận. Chạm để thử lại.</Text>
        </Pressable>
      ) : null}
      {!comments.isPending && !comments.isError && items.length === 0 ? (
        <Text style={[styles.hint, { color: theme.mutedForeground }]}>Chưa có bình luận nào. Hãy là người đầu tiên.</Text>
      ) : null}

      {items.map((comment) => {
        const mine = !!me.data && me.data.id === comment.author.id;
        const canDelete = mine || (!!me.data && me.data.id === postAuthorId);
        return (
          <View key={comment.id} style={styles.comment}>
            <Pressable accessibilityRole="button" onPress={() => router.push({ pathname: '/profile/[id]', params: { id: comment.author.id } })}>
              <Text style={[styles.author, { color: theme.foreground }]}>
                {comment.author.fullName} <Text style={[styles.meta, { color: theme.mutedForeground }]}>@{comment.author.username} · {formatTime(comment.createdAt)}</Text>
              </Text>
            </Pressable>
            <Text style={[styles.body, { color: theme.foreground }]}>{comment.body}</Text>
            {canDelete ? (
              <View style={styles.commentActions}>
                {mine ? (
                  <Pressable accessibilityRole="button" onPress={() => { setEditingId(comment.id); setDraft(comment.body); setError(''); }}>
                    <Text style={[styles.action, { color: theme.primary }]}>Sửa</Text>
                  </Pressable>
                ) : null}
                <Pressable accessibilityRole="button" accessibilityLabel={mine ? 'Xóa bình luận' : `Xóa bình luận của ${comment.author.fullName}`} disabled={actions.remove.isPending} onPress={() => confirmDelete(() => actions.remove.mutate(comment.id))}>
                  <Text style={[styles.action, { color: theme.destructive }]}>Xóa</Text>
                </Pressable>
              </View>
            ) : null}
          </View>
        );
      })}
      {actions.remove.isError ? <Text accessibilityRole="alert" style={[styles.hint, { color: theme.destructive }]}>Không xóa được bình luận. Vui lòng thử lại.</Text> : null}

      {comments.hasNextPage ? (
        <Pressable accessibilityRole="button" disabled={comments.isFetchingNextPage} onPress={() => void comments.fetchNextPage()} style={styles.more}>
          <Text style={[styles.action, { color: theme.primary }]}>{comments.isFetchingNextPage ? 'Đang tải…' : 'Xem thêm bình luận'}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { borderTopWidth: 8, padding: Spacing.three, gap: Spacing.three },
  title: { fontFamily: Fonts.headingBold, fontSize: 16 },
  composer: { gap: Spacing.two },
  input: { minHeight: 64, borderWidth: 1, borderRadius: Radius.xl, padding: Spacing.two, fontFamily: Fonts.sans, fontSize: 14, textAlignVertical: 'top' },
  composerActions: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: Spacing.three },
  send: { minHeight: 40, borderRadius: Radius.xl, paddingHorizontal: Spacing.four, alignItems: 'center', justifyContent: 'center' },
  sendText: { fontFamily: Fonts.sansBold, fontSize: 14 },
  loginPrompt: { minHeight: 44, borderWidth: 1, borderRadius: Radius.xl, alignItems: 'center', justifyContent: 'center' },
  loading: { padding: Spacing.three },
  hint: { fontFamily: Fonts.sans, fontSize: 13, lineHeight: 19 },
  comment: { gap: Spacing.one },
  author: { fontFamily: Fonts.sansSemibold, fontSize: 14 },
  meta: { fontFamily: Fonts.sans, fontSize: 12 },
  body: { fontFamily: Fonts.sans, fontSize: 14, lineHeight: 21 },
  commentActions: { flexDirection: 'row', gap: Spacing.four },
  action: { fontFamily: Fonts.sansSemibold, fontSize: 13 },
  more: { minHeight: 44, alignItems: 'center', justifyContent: 'center' },
});
