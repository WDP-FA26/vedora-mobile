import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Keyboard, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Fonts, Radius, Spacing } from '@/constants/theme';
import { ProfileAvatar } from '@/features/profile/components/profile-avatar';
import { useMyProfile } from '@/features/profile/hooks/use-profile';
import { useTheme } from '@/hooks/use-theme';
import { ChatComposer } from '@/shared/components/chat/chat-composer';

import type { CommentDraft } from '../hooks/use-comment-draft';
import { useComments } from '../hooks/use-posts';
import { MAX_COMMENT_LENGTH, type Comment } from '../types/posts.schema';

/** "Vừa xong", "5 phút", "3 giờ", "2 ngày", then the date. */
function relativeTime(value: string, now = Date.now()) {
  const time = new Date(value).getTime();
  if (Number.isNaN(time)) return '';
  const seconds = Math.max(0, Math.round((now - time) / 1000));
  if (seconds < 60) return 'Vừa xong';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} phút`;
  if (seconds < 86_400) return `${Math.floor(seconds / 3600)} giờ`;
  if (seconds < 7 * 86_400) return `${Math.floor(seconds / 86_400)} ngày`;
  return new Intl.DateTimeFormat('vi-VN', { day: 'numeric', month: 'short', year: new Date(time).getFullYear() === new Date(now).getFullYear() ? undefined : 'numeric' }).format(time);
}

function wasEdited(comment: Comment) {
  return new Date(comment.updatedAt).getTime() - new Date(comment.createdAt).getTime() > 1000;
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
  const empty = !comments.isPending && !comments.isError && items.length === 0;

  return (
    <View style={[styles.section, { backgroundColor: theme.card, borderTopColor: theme.border }]}>
      <View style={styles.titleRow}>
        <Text accessibilityRole="header" style={[styles.title, { color: theme.foreground }]}>Bình luận</Text>
        <View style={[styles.count, { backgroundColor: theme.muted }]}>
          <Text style={[styles.countText, { color: theme.mutedForeground }]}>{commentCount}</Text>
        </View>
      </View>

      {comments.isPending ? <ActivityIndicator color={theme.primary} style={styles.loading} /> : null}
      {comments.isError ? (
        <View style={[styles.notice, { backgroundColor: theme.muted }]}>
          <Text style={[styles.noticeText, { color: theme.destructive }]}>Không tải được bình luận.</Text>
          <Pressable accessibilityRole="button" onPress={() => void comments.refetch()} hitSlop={8}>
            <Text style={[styles.noticeAction, { color: theme.primary }]}>Thử lại</Text>
          </Pressable>
        </View>
      ) : null}
      {empty ? (
        <View style={styles.empty}>
          <View style={[styles.emptyIcon, { backgroundColor: theme.secondary }]}>
            <SymbolView name={{ ios: 'bubble.left', android: 'chat_bubble_outline', web: 'chat_bubble_outline' }} size={22} tintColor={theme.primary} />
          </View>
          <Text style={[styles.emptyTitle, { color: theme.foreground }]}>Chưa có bình luận</Text>
          <Text style={[styles.emptyText, { color: theme.mutedForeground }]}>Hãy là người đầu tiên chia sẻ cảm nghĩ.</Text>
        </View>
      ) : null}

      <View style={styles.list}>
        {items.map((comment) => {
          const mine = !!me.data && me.data.id === comment.author.id;
          const isPostAuthor = comment.author.id === postAuthorId;
          const canDelete = mine || (!!me.data && me.data.id === postAuthorId);
          const edited = wasEdited(comment);
          return (
            <View key={comment.id} style={styles.comment}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Xem hồ sơ ${comment.author.fullName}`}
                onPress={() => router.push({ pathname: '/profile/[id]', params: { id: comment.author.id } })}>
                <ProfileAvatar profile={{ fullName: comment.author.fullName, avatarUrl: comment.author.avatarUrl ?? null }} size={38} style={styles.avatar} />
              </Pressable>
              <View style={styles.commentBody}>
                <View style={[styles.bubble, { backgroundColor: theme.muted }]}>
                  <View style={styles.nameRow}>
                    <Pressable accessibilityRole="button" onPress={() => router.push({ pathname: '/profile/[id]', params: { id: comment.author.id } })} style={styles.nameButton}>
                      <Text numberOfLines={1} style={[styles.author, { color: theme.foreground }]}>{comment.author.fullName}</Text>
                    </Pressable>
                    {isPostAuthor ? (
                      <View style={[styles.badge, { backgroundColor: theme.secondary }]}>
                        <Text style={[styles.badgeText, { color: theme.secondaryForeground }]}>Tác giả</Text>
                      </View>
                    ) : null}
                  </View>
                  <Text selectable style={[styles.body, { color: theme.foreground }]}>{comment.body}</Text>
                </View>
                <View style={styles.metaRow}>
                  <Text style={[styles.meta, { color: theme.mutedForeground }]}>{relativeTime(comment.createdAt)}{edited ? ' · Đã sửa' : ''}</Text>
                  {mine ? (
                    <Pressable accessibilityRole="button" accessibilityLabel="Sửa bình luận" hitSlop={8} onPress={() => draft.startEdit(comment)}>
                      <Text style={[styles.action, { color: theme.mutedForeground }]}>Sửa</Text>
                    </Pressable>
                  ) : null}
                  {canDelete ? (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={mine ? 'Xóa bình luận' : `Xóa bình luận của ${comment.author.fullName}`}
                      disabled={remove.isPending}
                      hitSlop={8}
                      onPress={() => confirmDelete(() => remove.mutate(comment.id))}>
                      <Text style={[styles.action, { color: theme.destructive, opacity: remove.isPending ? 0.5 : 1 }]}>Xóa</Text>
                    </Pressable>
                  ) : null}
                </View>
              </View>
            </View>
          );
        })}
      </View>
      {remove.isError ? <Text accessibilityRole="alert" style={[styles.errorText, { color: theme.destructive }]}>Không xóa được bình luận. Vui lòng thử lại.</Text> : null}

      {comments.hasNextPage ? (
        <Pressable
          accessibilityRole="button"
          disabled={comments.isFetchingNextPage}
          onPress={() => void comments.fetchNextPage()}
          style={({ pressed }) => [styles.more, { backgroundColor: theme.secondary, opacity: comments.isFetchingNextPage ? 0.6 : pressed ? 0.8 : 1 }]}>
          <Text style={[styles.moreText, { color: theme.secondaryForeground }]}>{comments.isFetchingNextPage ? 'Đang tải…' : 'Xem thêm bình luận'}</Text>
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

  const inset = { backgroundColor: theme.card, paddingBottom: keyboardOpen ? 0 : insets.bottom };

  if (!draft.token) {
    return (
      <View style={[styles.loginBar, inset, { borderTopColor: theme.border }]}>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push({ pathname: '/login', params: { returnTo: '/explore' } })}
          style={({ pressed }) => [styles.loginPrompt, { backgroundColor: theme.muted, opacity: pressed ? 0.8 : 1 }]}>
          <Text style={[styles.loginText, { color: theme.primary }]}>Đăng nhập để bình luận</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={inset}>
      {draft.editingId ? (
        <View style={[styles.editing, { backgroundColor: theme.secondary }]}>
          <SymbolView name={{ ios: 'pencil', android: 'edit', web: 'edit' }} size={14} tintColor={theme.primary} />
          <Text style={[styles.editingText, { color: theme.secondaryForeground }]}>Đang sửa bình luận</Text>
          <Pressable accessibilityRole="button" onPress={draft.cancelEdit} hitSlop={8}>
            <Text style={[styles.action, { color: theme.primary }]}>Hủy</Text>
          </Pressable>
        </View>
      ) : null}
      {draft.error ? <Text accessibilityRole="alert" style={[styles.errorText, styles.composerError, { color: theme.destructive }]}>{draft.error}</Text> : null}
      <ChatComposer
        value={draft.draft}
        onChangeText={draft.changeDraft}
        onSubmit={() => void draft.submit()}
        placeholder="Viết bình luận…"
        inputLabel="Viết bình luận"
        sendLabel={draft.editingId ? 'Lưu bình luận' : 'Gửi bình luận'}
        sendDisabled={draft.pending}
        maxLength={MAX_COMMENT_LENGTH}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  section: { borderTopWidth: StyleSheet.hairlineWidth, paddingHorizontal: Spacing.three, paddingTop: Spacing.three + Spacing.one, paddingBottom: Spacing.four, gap: Spacing.three },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  title: { fontFamily: Fonts.headingBold, fontSize: 17, lineHeight: 24 },
  count: { minWidth: 26, height: 22, borderRadius: 11, paddingHorizontal: Spacing.two, alignItems: 'center', justifyContent: 'center' },
  countText: { fontFamily: Fonts.sansBold, fontSize: 12, lineHeight: 16 },
  loading: { padding: Spacing.three },
  notice: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.three, borderRadius: Radius.xl, padding: Spacing.three },
  noticeText: { flex: 1, fontFamily: Fonts.sansMedium, fontSize: 13, lineHeight: 19 },
  noticeAction: { fontFamily: Fonts.sansBold, fontSize: 13, lineHeight: 19 },
  empty: { alignItems: 'center', gap: Spacing.one + Spacing.half, paddingVertical: Spacing.four },
  emptyIcon: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.one },
  emptyTitle: { fontFamily: Fonts.headingBold, fontSize: 15, lineHeight: 22 },
  emptyText: { fontFamily: Fonts.sans, fontSize: 13, lineHeight: 19, textAlign: 'center' },
  list: { gap: Spacing.three + Spacing.one },
  comment: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.two + Spacing.one },
  avatar: { borderWidth: 0 },
  commentBody: { flex: 1, minWidth: 0, alignItems: 'flex-start', gap: Spacing.one },
  bubble: { maxWidth: '100%', borderRadius: Radius['2xl'], borderTopLeftRadius: Radius.sm, paddingHorizontal: Spacing.three - Spacing.one, paddingVertical: Spacing.two + Spacing.one, gap: 2 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  nameButton: { flexShrink: 1 },
  author: { fontFamily: Fonts.sansBold, fontSize: 14, lineHeight: 20 },
  badge: { borderRadius: 99, paddingHorizontal: Spacing.two, paddingVertical: 1 },
  badgeText: { fontFamily: Fonts.sansBold, fontSize: 10, lineHeight: 15 },
  body: { fontFamily: Fonts.sans, fontSize: 14, lineHeight: 21 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, paddingHorizontal: Spacing.two },
  meta: { fontFamily: Fonts.sans, fontSize: 12, lineHeight: 18 },
  action: { fontFamily: Fonts.sansBold, fontSize: 12, lineHeight: 18 },
  errorText: { fontFamily: Fonts.sans, fontSize: 13, lineHeight: 19 },
  more: { alignSelf: 'center', minHeight: 40, borderRadius: Radius['4xl'], paddingHorizontal: Spacing.four, alignItems: 'center', justifyContent: 'center' },
  moreText: { fontFamily: Fonts.sansBold, fontSize: 13, lineHeight: 18 },
  loginBar: { borderTopWidth: StyleSheet.hairlineWidth, paddingHorizontal: Spacing.three, paddingTop: Spacing.two + Spacing.one, paddingBottom: Spacing.two + Spacing.one },
  loginPrompt: { minHeight: 44, borderRadius: Radius['3xl'], alignItems: 'center', justifyContent: 'center' },
  loginText: { fontFamily: Fonts.sansBold, fontSize: 14, lineHeight: 20 },
  editing: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, paddingHorizontal: Spacing.three, paddingVertical: Spacing.two },
  editingText: { flex: 1, fontFamily: Fonts.sansMedium, fontSize: 13, lineHeight: 18 },
  composerError: { paddingHorizontal: Spacing.three, paddingTop: Spacing.two },
});
