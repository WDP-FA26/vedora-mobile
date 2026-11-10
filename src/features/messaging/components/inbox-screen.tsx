import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useMemo } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Fonts, Radius, Spacing } from '@/constants/theme';
import { ProfileAvatar } from '@/features/profile/components/profile-avatar';
import { useTheme } from '@/hooks/use-theme';
import { useSessionStore } from '@/shared/stores/session-store';

import { useInbox } from '../hooks/use-messaging';
import type { Conversation } from '../types/messaging.schema';
import { formatMessageTime } from '../utils/messaging';

const activityTime = (conversation: Conversation) => (conversation.lastMessage ? new Date(conversation.lastMessage.createdAt).getTime() : 0);

/** Label shown on a row so friends, strangers and pending replies can be told apart in one list. */
function kindOf(conversation: Conversation): { label: string; tone: 'friend' | 'stranger' | 'pending' } {
  if (conversation.box === 'friends') return { label: 'Bạn bè', tone: 'friend' };
  if (conversation.requestDirection === 'outgoing') return { label: 'Chờ phản hồi', tone: 'pending' };
  return { label: 'Tin nhắn lạ', tone: 'stranger' };
}

/** One inbox: friends and message requests together, newest activity first, each row labelled. */
export function InboxScreen() {
  const theme = useTheme();
  const token = useSessionStore((state) => state.accessToken);

  return (
    <SafeAreaView edges={['top']} style={[styles.screen, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Quay lại"
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/explore'))}
          style={[styles.back, { backgroundColor: theme.muted }]}>
          <SymbolView name={{ ios: 'chevron.left', android: 'arrow_back', web: 'arrow_back' }} size={20} tintColor={theme.foreground} />
        </Pressable>
        <Text accessibilityRole="header" style={[styles.title, { color: theme.foreground }]}>Tin nhắn</Text>
      </View>
      {token ? <InboxList /> : (
        <View style={styles.centered}>
          <Text style={[styles.emptyTitle, { color: theme.foreground }]}>Đăng nhập để nhắn tin</Text>
          <Text style={[styles.emptyText, { color: theme.mutedForeground }]}>Bạn có thể nhắn cho người mình theo dõi và nhận tin từ người theo dõi bạn.</Text>
          <Pressable accessibilityRole="button" onPress={() => router.push({ pathname: '/login', params: { returnTo: '/explore' } })} style={[styles.primary, { backgroundColor: theme.primary }]}>
            <Text style={[styles.primaryText, { color: theme.primaryForeground }]}>Đăng nhập</Text>
          </Pressable>
        </View>
      )}
    </SafeAreaView>
  );
}

function InboxList() {
  const theme = useTheme();
  const friends = useInbox('friends');
  const requests = useInbox('requests');
  const sources = [friends, requests];

  // The API pages each box separately, so the two are merged here by last activity (ties broken by id).
  const items = useMemo(() => {
    const all = [...(friends.data?.pages ?? []), ...(requests.data?.pages ?? [])].flatMap((page) => page.items);
    return all.sort((a, b) => activityTime(b) - activityTime(a) || a.id.localeCompare(b.id));
  }, [friends.data, requests.data]);

  const pending = sources.some((query) => query.isPending);
  const failed = sources.some((query) => query.isError);
  const hasMore = sources.some((query) => query.hasNextPage);
  const loadingMore = sources.some((query) => query.isFetchingNextPage);
  const refreshing = sources.some((query) => query.isRefetching) && !loadingMore;

  function loadMore() {
    for (const query of sources) if (query.hasNextPage && !query.isFetchingNextPage) void query.fetchNextPage();
  }
  function refresh() {
    for (const query of sources) void query.refetch();
  }

  return (
    <FlatList
      data={items}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <ConversationRow conversation={item} />}
      contentContainerStyle={items.length ? styles.list : styles.emptyList}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={theme.primary} colors={[theme.primary]} />}
      onEndReached={() => { if (hasMore) loadMore(); }}
      onEndReachedThreshold={0.4}
      ListEmptyComponent={pending ? (
        <View style={styles.centered}><ActivityIndicator color={theme.primary} /></View>
      ) : failed ? (
        <View style={styles.centered}>
          <Text style={[styles.emptyTitle, { color: theme.foreground }]}>Chưa tải được tin nhắn</Text>
          <Pressable accessibilityRole="button" onPress={refresh} style={[styles.primary, { backgroundColor: theme.primary }]}>
            <Text style={[styles.primaryText, { color: theme.primaryForeground }]}>Thử lại</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.centered}>
          <Text style={[styles.emptyTitle, { color: theme.foreground }]}>Chưa có cuộc trò chuyện</Text>
          <Text style={[styles.emptyText, { color: theme.mutedForeground }]}>Mở hồ sơ một người bạn theo dõi và bấm Nhắn tin để bắt đầu. Tin từ người chưa kết bạn cũng hiện ở đây.</Text>
        </View>
      )}
      ListFooterComponent={loadingMore ? <ActivityIndicator style={styles.footer} color={theme.primary} /> : undefined}
    />
  );
}

function KindLabel({ conversation }: { conversation: Conversation }) {
  const theme = useTheme();
  const { label, tone } = kindOf(conversation);
  const background = tone === 'friend' ? theme.secondary : theme.muted;
  const color = tone === 'friend' ? theme.secondaryForeground : tone === 'stranger' ? theme.chart3 : theme.mutedForeground;
  return (
    <View style={[styles.kind, { backgroundColor: background }]}>
      <Text style={[styles.kindText, { color }]}>{label}</Text>
    </View>
  );
}

function ConversationRow({ conversation }: { conversation: Conversation }) {
  const theme = useTheme();
  const { peer, lastMessage, unreadCount } = conversation;
  const unread = unreadCount > 0;
  const mine = lastMessage ? lastMessage.senderId !== peer.id : false;
  const { tone } = kindOf(conversation);
  // A stranger's first message needs context; a request you sent says it is waiting.
  const hint = tone === 'stranger' && conversation.requestDirection === 'incoming'
    ? 'Muốn nhắn tin với bạn'
    : tone === 'pending' ? 'Chờ họ theo dõi lại để trả lời' : null;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${peer.fullName}, ${kindOf(conversation).label}${unread ? `, ${unreadCount} tin chưa đọc` : ''}`}
      onPress={() => router.push({ pathname: '/messages/[id]', params: { id: conversation.id } })}
      style={({ pressed }) => [styles.row, { borderBottomColor: theme.border, backgroundColor: pressed ? theme.muted : 'transparent' }]}>
      <ProfileAvatar profile={peer} size={52} style={styles.avatar} />
      <View style={styles.rowBody}>
        <View style={styles.rowTop}>
          <Text numberOfLines={1} style={[styles.name, { color: theme.foreground }]}>{peer.fullName}</Text>
          <KindLabel conversation={conversation} />
          <View style={styles.spacer} />
          {lastMessage ? <Text style={[styles.time, { color: unread ? theme.primary : theme.mutedForeground }]}>{formatMessageTime(lastMessage.createdAt)}</Text> : null}
        </View>
        <View style={styles.rowBottom}>
          <Text numberOfLines={1} style={[styles.preview, { color: unread ? theme.foreground : theme.mutedForeground }, unread && styles.previewUnread]}>
            {lastMessage ? `${mine ? 'Bạn: ' : ''}${lastMessage.body}` : 'Chưa có tin nhắn'}
          </Text>
          {unread ? (
            <View style={[styles.unreadBadge, { backgroundColor: theme.primary }]}>
              <Text style={[styles.unreadText, { color: theme.primaryForeground }]}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
            </View>
          ) : null}
        </View>
        {hint ? <Text numberOfLines={1} style={[styles.hint, { color: theme.mutedForeground }]}>{hint}</Text> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { minHeight: 64, flexDirection: 'row', alignItems: 'center', gap: Spacing.three, paddingHorizontal: Spacing.three, borderBottomWidth: StyleSheet.hairlineWidth },
  back: { width: 40, height: 40, borderRadius: Radius.xl, alignItems: 'center', justifyContent: 'center' },
  title: { flex: 1, fontFamily: Fonts.headingBold, fontSize: 20, lineHeight: 28 },
  list: { width: '100%', maxWidth: 680, alignSelf: 'center', paddingVertical: Spacing.two },
  emptyList: { flexGrow: 1 },
  footer: { paddingVertical: Spacing.three },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.two + Spacing.one, padding: Spacing.four },
  emptyTitle: { fontFamily: Fonts.headingBold, fontSize: 17, lineHeight: 24, textAlign: 'center' },
  emptyText: { fontFamily: Fonts.sans, fontSize: 14, lineHeight: 21, textAlign: 'center' },
  primary: { minHeight: 44, alignSelf: 'stretch', maxWidth: 320, borderRadius: Radius.xl, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.four },
  primaryText: { fontFamily: Fonts.sansBold, fontSize: 15 },
  row: { minHeight: 76, flexDirection: 'row', alignItems: 'center', gap: Spacing.three, paddingHorizontal: Spacing.three, paddingVertical: Spacing.two + Spacing.one, borderBottomWidth: StyleSheet.hairlineWidth },
  avatar: { borderWidth: 0 },
  rowBody: { flex: 1, minWidth: 0, gap: Spacing.half },
  rowTop: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  name: { flexShrink: 1, fontFamily: Fonts.sansBold, fontSize: 16, lineHeight: 22 },
  spacer: { flex: 1 },
  kind: { borderRadius: 99, paddingHorizontal: Spacing.two, paddingVertical: 1 },
  kindText: { fontFamily: Fonts.sansBold, fontSize: 10, lineHeight: 15 },
  time: { fontFamily: Fonts.sans, fontSize: 12, lineHeight: 17 },
  rowBottom: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  preview: { flex: 1, fontFamily: Fonts.sans, fontSize: 14, lineHeight: 20 },
  previewUnread: { fontFamily: Fonts.sansSemibold },
  hint: { fontFamily: Fonts.sans, fontSize: 12, lineHeight: 17 },
  unreadBadge: { minWidth: 20, height: 20, borderRadius: 10, paddingHorizontal: 6, alignItems: 'center', justifyContent: 'center' },
  unreadText: { fontFamily: Fonts.sansBold, fontSize: 11, lineHeight: 15 },
});
