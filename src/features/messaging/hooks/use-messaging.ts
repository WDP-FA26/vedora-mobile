import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useSessionStore } from '@/shared/stores/session-store';

import { messagingKeys } from '../data/messaging.keys';
import { getContact, getConversation, getConversations, getMessages, markConversationRead, sendMessage } from '../services/messaging.service';
import { useMessagingStreamStore } from '../stores/messaging-stream-store';
import type { MessagingBox } from '../types/messaging.schema';

const POLL_MS = 5_000;
const UNREAD_POLL_MS = 30_000;

/** Polls only while the SSE stream is down; a healthy stream refetches on events instead. */
const pollWhileOffline = (interval: number) => () => (useMessagingStreamStore.getState().live ? false : interval);

export function useInbox(box: MessagingBox) {
  const token = useSessionStore((state) => state.accessToken);
  return useInfiniteQuery({
    queryKey: messagingKeys.inbox(box),
    initialPageParam: null as string | null,
    queryFn: ({ pageParam, signal }) => getConversations({ box, cursor: pageParam, signal }),
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled: !!token,
    refetchInterval: pollWhileOffline(POLL_MS),
  });
}

/** Total unread across both inboxes (first 50 conversations each), for the header badge. */
export function useMessagingUnread() {
  const token = useSessionStore((state) => state.accessToken);
  return useQuery({
    queryKey: messagingKeys.unread,
    queryFn: async ({ signal }) => {
      const pages = await Promise.all((['friends', 'requests'] as const).map((box) => getConversations({ box, cursor: null, limit: 50, signal })));
      return pages.flatMap((page) => page.items).reduce((total, item) => total + item.unreadCount, 0);
    },
    enabled: !!token,
    refetchInterval: pollWhileOffline(UNREAD_POLL_MS),
  });
}

/** Who you would message, whether you can, and the existing conversation if any. Never creates one. */
export function useContact(userId: string | undefined) {
  const token = useSessionStore((state) => state.accessToken);
  return useQuery({
    queryKey: messagingKeys.contact(userId ?? ''),
    queryFn: ({ signal }) => getContact(userId!, signal),
    enabled: !!token && !!userId,
    refetchInterval: pollWhileOffline(POLL_MS),
  });
}

export function useConversation(id: string | null | undefined) {
  const token = useSessionStore((state) => state.accessToken);
  return useQuery({
    queryKey: messagingKeys.conversation(id ?? ''),
    queryFn: ({ signal }) => getConversation(id!, signal),
    enabled: !!token && !!id,
    refetchInterval: pollWhileOffline(POLL_MS),
  });
}

/** Newest page first; use `mergeMessages` to get the thread oldest first. */
export function useMessages(id: string | null | undefined) {
  const token = useSessionStore((state) => state.accessToken);
  return useInfiniteQuery({
    queryKey: messagingKeys.messages(id ?? ''),
    initialPageParam: null as string | null,
    queryFn: ({ pageParam, signal }) => getMessages({ id: id!, cursor: pageParam, signal }),
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled: !!token && !!id,
    refetchInterval: pollWhileOffline(POLL_MS),
  });
}

export function useSendMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    networkMode: 'always',
    retry: false,
    mutationFn: sendMessage,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: messagingKeys.all }),
  });
}

export function useMarkRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, messageId }: { id: string; messageId: string }) => markConversationRead(id, messageId),
    onSuccess: (_result, { id }) => {
      void queryClient.invalidateQueries({ queryKey: messagingKeys.conversation(id) });
      void queryClient.invalidateQueries({ queryKey: messagingKeys.unread });
      void queryClient.invalidateQueries({ queryKey: ['messaging', 'inbox'] });
    },
  });
}
