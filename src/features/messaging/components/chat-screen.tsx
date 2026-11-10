import { router, useIsFocused } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, AppState, FlatList, Keyboard, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, View, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { Fonts, Radius, Spacing } from '@/constants/theme';
import { FollowButton } from '@/features/profile/components/follow-button';
import { ProfileAvatar } from '@/features/profile/components/profile-avatar';
import { useTheme } from '@/hooks/use-theme';
import { ChatComposer } from '@/shared/components/chat/chat-composer';
import { useSessionStore } from '@/shared/stores/session-store';

import { useContact, useConversation, useMarkRead, useMessages, useSendMessage } from '../hooks/use-messaging';
import { MAX_MESSAGE_LENGTH, type Message } from '../types/messaging.schema';
import { createClientMessageId, formatMessageTime, mergeMessages, messagingErrorText } from '../utils/messaging';

/** Opens either an existing conversation (`conversationId`) or a person (`userId`), which creates nothing until the first send. */
export function ChatScreen({ conversationId, userId }: { conversationId?: string; userId?: string }) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const token = useSessionStore((state) => state.accessToken);
  const focused = useIsFocused();
  const contact = useContact(conversationId ? undefined : userId);
  const [startedId, setStartedId] = useState<string | null>(null);
  const activeId = conversationId ?? startedId ?? contact.data?.conversationId ?? null;
  const conversation = useConversation(activeId);
  const history = useMessages(activeId);
  const send = useSendMessage();
  const markRead = useMarkRead();
  const [draft, setDraft] = useState('');
  const [error, setError] = useState('');
  const [atBottom, setAtBottom] = useState(true);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const attempt = useRef<{ id: string; body: string } | null>(null);
  const markedId = useRef<string | null>(null);

  const peer = conversation.data?.peer ?? contact.data?.peer;
  const relation = conversation.data ?? contact.data;
  const messages = useMemo(() => mergeMessages(history.data?.pages), [history.data]);
  const newestFirst = useMemo(() => [...messages].reverse(), [messages]);
  const peerRead = conversation.data?.peerReadSequence ?? 0;
  const lastMine = [...messages].reverse().find((message) => message.senderId !== peer?.id);

  useEffect(() => {
    const show = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow', () => setKeyboardVisible(true));
    const hide = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide', () => setKeyboardVisible(false));
    return () => { show.remove(); hide.remove(); };
  }, []);

  // Mark the newest incoming message read only while it is actually in view: screen focused, app active, list at the bottom.
  const newest = messages.at(-1);
  useEffect(() => {
    if (!activeId || !newest || !peer || !conversation.data || !focused || !atBottom) return;
    if (AppState.currentState !== 'active' || newest.senderId !== peer.id) return;
    if (newest.sequence <= conversation.data.myReadSequence || markedId.current === newest.id) return;
    markedId.current = newest.id;
    markRead.mutate({ id: activeId, messageId: newest.id });
  }, [activeId, atBottom, conversation.data, focused, markRead, newest, peer]);

  async function submit() {
    const body = draft.trim();
    if (!body || send.isPending) return;
    // A retry of the same text keeps its id so the server returns the first copy instead of a duplicate.
    if (!attempt.current || attempt.current.body !== body) attempt.current = { id: createClientMessageId(), body };
    setError('');
    try {
      const result = await send.mutateAsync({ conversationId: activeId, userId: peer?.id ?? userId, clientMessageId: attempt.current.id, body });
      attempt.current = null;
      setDraft('');
      setStartedId(result.conversationId);
    } catch (caught) {
      setError(messagingErrorText(caught));
    }
  }

  function onScroll(event: NativeSyntheticEvent<NativeScrollEvent>) {
    setAtBottom(event.nativeEvent.contentOffset.y < 60);
  }

  if (!token) {
    return (
      <SafeAreaView edges={['top']} style={[styles.screen, { backgroundColor: theme.background }]}>
        <ChatHeader />
        <View style={styles.centered}>
          <Text style={[styles.centerTitle, { color: theme.foreground }]}>Đăng nhập để nhắn tin</Text>
          <Pressable accessibilityRole="button" onPress={() => router.push({ pathname: '/login', params: { returnTo: '/explore' } })} style={[styles.primary, { backgroundColor: theme.primary }]}>
            <Text style={[styles.primaryText, { color: theme.primaryForeground }]}>Đăng nhập</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  if (!peer) {
    const failed = contact.isError || conversation.isError;
    return (
      <SafeAreaView edges={['top']} style={[styles.screen, { backgroundColor: theme.background }]}>
        <ChatHeader />
        <View style={styles.centered}>
          {failed ? <>
            <Text style={[styles.centerTitle, { color: theme.foreground }]}>Không mở được cuộc trò chuyện</Text>
            <Text style={[styles.centerText, { color: theme.mutedForeground }]}>Người này không khả dụng hoặc bạn không có quyền xem cuộc trò chuyện.</Text>
          </> : <ActivityIndicator color={theme.primary} />}
        </View>
      </SafeAreaView>
    );
  }

  const canSend = relation?.canSend ?? false;
  const incomingRequest = conversation.data?.requestDirection === 'incoming';

  return (
    <SafeAreaView edges={['top']} style={[styles.screen, { backgroundColor: theme.background }]}>
      <ChatHeader peer={peer} />
      <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <FlatList
          inverted
          style={styles.screen}
          data={newestFirst}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <MessageBubble
              message={item}
              mine={item.senderId !== peer.id}
              seen={item.id === lastMine?.id && item.sequence <= peerRead}
            />
          )}
          contentContainerStyle={styles.messages}
          keyboardShouldPersistTaps="handled"
          onScroll={onScroll}
          scrollEventThrottle={64}
          onEndReached={() => { if (history.hasNextPage && !history.isFetchingNextPage) void history.fetchNextPage(); }}
          onEndReachedThreshold={0.3}
          ListFooterComponent={history.isFetchingNextPage ? <ActivityIndicator style={styles.older} color={theme.primary} /> : undefined}
          ListEmptyComponent={history.isPending && activeId ? undefined : (
            // The list is inverted, so flip the empty state back upright.
            <View style={[styles.emptyThread, styles.flipped]}>
              <ProfileAvatar profile={peer} size={64} />
              <Text style={[styles.centerTitle, { color: theme.foreground }]}>{peer.fullName}</Text>
              <Text style={[styles.centerText, { color: theme.mutedForeground }]}>
                {canSend ? 'Hãy gửi lời chào đầu tiên.' : 'Chưa có tin nhắn nào.'}
              </Text>
            </View>
          )}
        />
        {error ? <Text accessibilityRole="alert" style={[styles.error, { color: theme.destructive }]}>{error}</Text> : null}
        {canSend ? (
          <View style={{ backgroundColor: theme.card, paddingBottom: keyboardVisible ? 0 : insets.bottom }}>
            <ChatComposer
              value={draft}
              onChangeText={(value) => { setDraft(value); setError(''); }}
              onSubmit={() => void submit()}
              placeholder={`Nhắn cho ${peer.fullName}…`}
              inputLabel="Nội dung tin nhắn"
              sendLabel="Gửi tin nhắn"
              sendDisabled={send.isPending}
              maxLength={MAX_MESSAGE_LENGTH}
            />
          </View>
        ) : relation ? (
          <View style={[styles.follow, { backgroundColor: theme.card, borderTopColor: theme.border, paddingBottom: Spacing.three + (keyboardVisible ? 0 : insets.bottom) }]}>
            <Text style={[styles.followText, { color: theme.foreground }]}>
              {incomingRequest ? `${peer.fullName} đã theo dõi bạn. Theo dõi lại để trả lời.` : `Theo dõi ${peer.fullName} để nhắn tin.`}
            </Text>
            <FollowButton profileId={peer.id} />
          </View>
        ) : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function ChatHeader({ peer }: { peer?: { id: string; fullName: string; username: string; avatarUrl: string | null } }) {
  const theme = useTheme();
  return (
    <View style={[styles.header, { borderBottomColor: theme.border }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Quay lại"
        onPress={() => (router.canGoBack() ? router.back() : router.replace('/messages'))}
        style={[styles.back, { backgroundColor: theme.muted }]}>
        <SymbolView name={{ ios: 'chevron.left', android: 'arrow_back', web: 'arrow_back' }} size={20} tintColor={theme.foreground} />
      </Pressable>
      {peer ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Xem hồ sơ ${peer.fullName}`}
          onPress={() => router.push({ pathname: '/profile/[id]', params: { id: peer.id } })}
          style={styles.peer}>
          <ProfileAvatar profile={peer} size={40} style={styles.headerAvatar} />
          <View style={styles.peerText}>
            <Text numberOfLines={1} style={[styles.peerName, { color: theme.foreground }]}>{peer.fullName}</Text>
            <Text numberOfLines={1} style={[styles.peerHandle, { color: theme.mutedForeground }]}>@{peer.username}</Text>
          </View>
        </Pressable>
      ) : (
        <Text accessibilityRole="header" style={[styles.peerName, { color: theme.foreground }]}>Tin nhắn</Text>
      )}
    </View>
  );
}

function MessageBubble({ message, mine, seen }: { message: Message; mine: boolean; seen: boolean }) {
  const theme = useTheme();
  return (
    <View style={[styles.bubbleRow, mine && styles.bubbleRowMine]}>
      <View style={[styles.bubbleColumn, mine && styles.bubbleColumnMine]}>
        <View style={[
          styles.bubble,
          mine
            ? { backgroundColor: theme.primary, borderBottomRightRadius: Radius.sm }
            : { backgroundColor: theme.card, borderBottomLeftRadius: Radius.sm },
        ]}>
          <Text selectable style={[styles.bubbleText, { color: mine ? theme.primaryForeground : theme.foreground }]}>{message.body}</Text>
        </View>
        <Text style={[styles.meta, { color: theme.mutedForeground }]}>
          {formatMessageTime(message.createdAt)}{seen ? ' · Đã xem' : ''}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { minHeight: 64, flexDirection: 'row', alignItems: 'center', gap: Spacing.three, paddingHorizontal: Spacing.three, borderBottomWidth: StyleSheet.hairlineWidth },
  back: { width: 40, height: 40, borderRadius: Radius.xl, alignItems: 'center', justifyContent: 'center' },
  peer: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: Spacing.two + Spacing.one },
  headerAvatar: { borderWidth: 0 },
  peerText: { flex: 1, minWidth: 0 },
  peerName: { fontFamily: Fonts.headingBold, fontSize: 17, lineHeight: 23 },
  peerHandle: { fontFamily: Fonts.sans, fontSize: 12, lineHeight: 17 },
  messages: { width: '100%', maxWidth: 680, alignSelf: 'center', padding: Spacing.three, gap: Spacing.two + Spacing.one, flexGrow: 1 },
  older: { paddingVertical: Spacing.three },
  emptyThread: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.two, padding: Spacing.four },
  flipped: { transform: [{ scaleY: -1 }] },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.two + Spacing.one, padding: Spacing.four },
  centerTitle: { fontFamily: Fonts.headingBold, fontSize: 17, lineHeight: 24, textAlign: 'center' },
  centerText: { fontFamily: Fonts.sans, fontSize: 14, lineHeight: 21, textAlign: 'center' },
  primary: { minHeight: 44, alignSelf: 'stretch', maxWidth: 320, borderRadius: Radius.xl, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.four },
  primaryText: { fontFamily: Fonts.sansBold, fontSize: 15 },
  error: { paddingHorizontal: Spacing.three, paddingBottom: Spacing.two, textAlign: 'center', fontFamily: Fonts.sansMedium, fontSize: 13, lineHeight: 19 },
  follow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.three, paddingHorizontal: Spacing.three, paddingTop: Spacing.three, borderTopWidth: StyleSheet.hairlineWidth },
  followText: { flex: 1, fontFamily: Fonts.sans, fontSize: 14, lineHeight: 20 },
  bubbleRow: { flexDirection: 'row' },
  bubbleRowMine: { justifyContent: 'flex-end' },
  bubbleColumn: { flexShrink: 1, maxWidth: '82%', alignItems: 'flex-start', gap: 2 },
  bubbleColumnMine: { alignItems: 'flex-end' },
  bubble: { borderRadius: Radius['2xl'], paddingHorizontal: Spacing.three - Spacing.one, paddingVertical: Spacing.two + Spacing.one },
  bubbleText: { fontFamily: Fonts.sans, fontSize: 15, lineHeight: 22 },
  meta: { fontFamily: Fonts.sans, fontSize: 11, lineHeight: 15, paddingHorizontal: Spacing.one },
});
