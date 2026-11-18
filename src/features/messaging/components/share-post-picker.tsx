import { router } from 'expo-router';
import { useState, type RefObject } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Fonts, Radius, Spacing } from '@/constants/theme';
import { ProfileAvatar } from '@/features/profile/components/profile-avatar';
import { useProfileList } from '@/features/profile/hooks/use-profile';
import { useTheme } from '@/hooks/use-theme';

import { useInbox, useSharePost } from '../hooks/use-messaging';
import { getContact } from '../services/messaging.service';
import { createClientMessageId, messagingErrorText } from '../utils/messaging';
import { shareRecipients } from '../utils/share-recipients';

/** Rendered inside PostMenu; retry IDs live in its parent so closing the picker does not lose them. */
export function SharePostPicker({ postId, selfId, lockRef, attemptsRef, onSent }: {
  postId: string; selfId: string; lockRef: RefObject<boolean>; attemptsRef: RefObject<Record<string, string>>; onSent: () => void;
}) {
  const theme = useTheme();
  const friends = useInbox('friends');
  const requests = useInbox('requests');
  const following = useProfileList(selfId, 'following');
  const share = useSharePost();
  const [filter, setFilter] = useState('');
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState('');
  const sources = [friends, requests, following];
  const recipients = shareRecipients(
    [...friends.data?.pages ?? [], ...requests.data?.pages ?? []].flatMap((page) => page.items),
    following.data?.pages.flatMap((page) => page.items) ?? [], selfId, filter,
  );

  async function send(userId: string) {
    if (lockRef.current) return;
    lockRef.current = true;
    setPending(userId); setError('');
    const key = `${postId}:${userId}`;
    const clientMessageId = attemptsRef.current[key] ??= createClientMessageId();
    try {
      // Recheck permissions even for following-list entries and when a relationship changed since loading.
      const contact = await getContact(userId);
      if (!contact.canSend) {
        setError('Bạn cần theo dõi người nhận hoặc chấp nhận lời mời trước khi gửi.');
        return;
      }
      const result = await share.mutateAsync({ userId, conversationId: contact.conversationId, clientMessageId, postId });
      delete attemptsRef.current[key];
      lockRef.current = false;
      onSent();
      router.push({ pathname: '/messages/[id]', params: { id: result.conversationId } });
    } catch (caught) {
      setError(messagingErrorText(caught, 'Chưa chia sẻ được bài viết. Hãy thử lại; hệ thống sẽ tránh gửi trùng.'));
    } finally { lockRef.current = false; setPending(null); }
  }

  return (
    <View style={styles.content}>
      <Text accessibilityRole="header" style={[styles.title, { color: theme.foreground }]}>Gửi bài viết qua tin nhắn</Text>
      <TextInput accessibilityLabel="Lọc người nhận theo tên" placeholder="Lọc tên hoặc tên đăng nhập…" placeholderTextColor={theme.mutedForeground}
        value={filter} onChangeText={setFilter} editable={!pending} maxLength={100} style={[styles.input, { color: theme.foreground, borderColor: theme.border }]} />
      <Text style={[styles.helper, { color: theme.mutedForeground }]}>Cuộc trò chuyện và người đang theo dõi. Bộ lọc áp dụng cho danh sách đã tải.</Text>
      {error ? <Text accessibilityRole="alert" style={[styles.helper, { color: theme.destructive }]}>{error}</Text> : null}
      <FlatList data={recipients} keyExtractor={({ peer }) => peer.id} keyboardShouldPersistTaps="handled" style={styles.list}
        renderItem={({ item }) => (
          <View style={[styles.row, { borderBottomColor: theme.border }]}>
            <ProfileAvatar profile={item.peer} size={40} />
            <View style={styles.name}>
              <Text numberOfLines={1} style={[styles.label, { color: theme.foreground }]}>{item.peer.fullName}</Text>
              <Text numberOfLines={1} style={[styles.helper, { color: theme.mutedForeground }]}>{item.canSend ? `@${item.peer.username}` : 'Chưa có quyền gửi tin nhắn'}</Text>
            </View>
            <Pressable accessibilityRole="button" accessibilityLabel={`Gửi bài viết cho ${item.peer.fullName}`} accessibilityState={{ disabled: !!pending || !item.canSend, busy: pending === item.peer.id }}
              disabled={!!pending || !item.canSend} onPress={() => void send(item.peer.id)} style={[styles.send, { opacity: pending || !item.canSend ? 0.5 : 1 }]}>
              {pending === item.peer.id ? <ActivityIndicator color={theme.primary} /> : <Text style={[styles.label, { color: theme.primary }]}>Gửi</Text>}
            </Pressable>
          </View>
        )}
        ListEmptyComponent={<Text style={[styles.helper, { color: theme.mutedForeground }]}>{sources.some((q) => q.isPending) ? 'Đang tải người nhận…' : 'Không tìm thấy người nhận. Hãy thử tải thêm hoặc theo dõi người bạn muốn gửi.'}</Text>}
        ListFooterComponent={<View style={styles.footer}>
          {sources.some((q) => q.isError) ? <Pressable accessibilityRole="button" disabled={!!pending} onPress={() => { for (const query of sources) void query.refetch(); }} style={styles.send}><Text style={[styles.label, { color: theme.destructive }]}>Không tải được một phần danh sách · Thử lại</Text></Pressable> : null}
          {sources.some((q) => q.hasNextPage) ? <Pressable accessibilityRole="button" disabled={!!pending || sources.some((q) => q.isFetchingNextPage)} onPress={() => { for (const query of sources) if (query.hasNextPage && !query.isFetchingNextPage) void query.fetchNextPage(); }} style={styles.send}>
            <Text style={[styles.label, { color: theme.primary }]}>{sources.some((q) => q.isFetchingNextPage) ? 'Đang tải…' : 'Tải thêm người nhận'}</Text>
          </Pressable> : null}
        </View>} />
    </View>
  );
}

const styles = StyleSheet.create({
  content: { flexShrink: 1, gap: Spacing.two },
  list: { flexGrow: 0, flexShrink: 1, maxHeight: 380 },
  title: { fontFamily: Fonts.headingBold, fontSize: 17, lineHeight: 24 },
  input: { minHeight: 44, borderWidth: 1, borderRadius: Radius.xl, paddingHorizontal: Spacing.three, fontFamily: Fonts.sans, fontSize: 14 },
  helper: { fontFamily: Fonts.sans, fontSize: 12, lineHeight: 18 },
  label: { fontFamily: Fonts.sansSemibold, fontSize: 14, lineHeight: 21 },
  row: { minHeight: 64, flexDirection: 'row', alignItems: 'center', gap: Spacing.two, borderBottomWidth: StyleSheet.hairlineWidth, paddingVertical: Spacing.two },
  name: { flex: 1, minWidth: 0 },
  send: { minHeight: 44, minWidth: 48, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.two },
  footer: { gap: Spacing.two },
});
