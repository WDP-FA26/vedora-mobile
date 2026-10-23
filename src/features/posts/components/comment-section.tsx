import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Keyboard, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Fonts, Radius, Spacing } from '@/constants/theme';
import { useMyProfile } from '@/features/profile/hooks/use-profile';
import { useTheme } from '@/hooks/use-theme';

import type { CommentDraft } from '../hooks/use-comment-draft';
import { useComments } from '../hooks/use-posts';
import { MAX_COMMENT_LENGTH, type Comment } from '../types/posts.schema';

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
export function CommentList({ postId, postAuthorId, commentCount, draft }: { postId: string; postAuthorId: string; commentCount: number; draft: CommentDraft }) {
  const theme = useTheme();
  const me = useMyProfile(draft.token);
  const comments = useComments(postId);
  const items: Comment[] = comments.data?.pages.flatMap((page) => page.items) ?? [];
  const { remove } = draft.actions;

  return (
    <View style={[styles.section, { backgroundColor: theme.card, borderTopColor: theme.border }]}>
      <Text style={[styles.title, { color: theme.foreground }]}>Bình luận ({commentCount})</Text>

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
                  <Pressable accessibilityRole="button" onPress={() => draft.startEdit(comment)}>
                    <Text style={[styles.action, { color: theme.primary }]}>Sửa</Text>
                  </Pressable>
                ) : null}
                <Pressable accessibilityRole="button" accessibilityLabel={mine ? 'Xóa bình luận' : `Xóa bình luận của ${comment.author.fullName}`} disabled={remove.isPending} onPress={() => confirmDelete(() => remove.mutate(comment.id))}>
                  <Text style={[styles.action, { color: theme.destructive }]}>Xóa</Text>
                </Pressable>
              </View>
            ) : null}
          </View>
        );
      })}
      {remove.isError ? <Text accessibilityRole="alert" style={[styles.hint, { color: theme.destructive }]}>Không xóa được bình luận. Vui lòng thử lại.</Text> : null}

      {comments.hasNextPage ? (
        <Pressable accessibilityRole="button" disabled={comments.isFetchingNextPage} onPress={() => void comments.fetchNextPage()} style={styles.more}>
          <Text style={[styles.action, { color: theme.primary }]}>{comments.isFetchingNextPage ? 'Đang tải…' : 'Xem thêm bình luận'}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

/** Pinned under the scrolling post; the screen's keyboard-avoiding view keeps it above the keyboard. */
export function CommentComposer({ draft }: { draft: CommentDraft }) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [keyboardOpen, setKeyboardOpen] = useState(false);

  useEffect(() => {
    const show = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow', () => setKeyboardOpen(true));
    const hide = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide', () => setKeyboardOpen(false));
    return () => { show.remove(); hide.remove(); };
  }, []);

  const bar = [styles.composer, { backgroundColor: theme.card, borderTopColor: theme.border, paddingBottom: Spacing.two + (keyboardOpen ? 0 : insets.bottom) }];

  if (!draft.token) {
    return (
      <View style={bar}>
        <Pressable accessibilityRole="button" onPress={() => router.push({ pathname: '/login', params: { returnTo: '/explore' } })} style={[styles.loginPrompt, { borderColor: theme.border }]}>
          <Text style={[styles.action, { color: theme.primary }]}>Đăng nhập để bình luận</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={bar}>
      {draft.editingId ? (
        <View style={styles.editingRow}>
          <Text style={[styles.hint, { color: theme.primary }]}>Đang sửa bình luận</Text>
          <Pressable accessibilityRole="button" onPress={draft.cancelEdit}><Text style={[styles.action, { color: theme.mutedForeground }]}>Hủy sửa</Text></Pressable>
        </View>
      ) : null}
      <View style={styles.inputRow}>
        <TextInput
          accessibilityLabel="Viết bình luận"
          value={draft.draft}
          onChangeText={draft.changeDraft}
          maxLength={MAX_COMMENT_LENGTH}
          multiline
          placeholder="Viết bình luận…"
          placeholderTextColor={theme.mutedForeground}
          style={[styles.input, { color: theme.foreground, borderColor: theme.border, backgroundColor: theme.background }]}
        />
        <Pressable accessibilityRole="button" disabled={draft.pending} onPress={() => void draft.submit()} style={[styles.send, { backgroundColor: theme.primary, opacity: draft.pending ? 0.6 : 1 }]}>
          <Text style={[styles.sendText, { color: theme.primaryForeground }]}>{draft.pending ? 'Đang gửi…' : draft.editingId ? 'Lưu' : 'Gửi'}</Text>
        </Pressable>
      </View>
      {draft.error ? <Text accessibilityRole="alert" style={[styles.hint, { color: theme.destructive }]}>{draft.error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { borderTopWidth: 8, padding: Spacing.three, gap: Spacing.three },
  title: { fontFamily: Fonts.headingBold, fontSize: 16 },
  composer: { borderTopWidth: 1, paddingHorizontal: Spacing.three, paddingTop: Spacing.two, gap: Spacing.one },
  editingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.two },
  input: { flex: 1, minHeight: 44, maxHeight: 120, borderWidth: 1, borderRadius: Radius.xl, paddingHorizontal: Spacing.three, paddingTop: Spacing.two + Spacing.half, paddingBottom: Spacing.two, fontFamily: Fonts.sans, fontSize: 14, textAlignVertical: 'top' },
  send: { minHeight: 44, borderRadius: Radius.xl, paddingHorizontal: Spacing.three, alignItems: 'center', justifyContent: 'center' },
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
