import { useQueryClient } from '@tanstack/react-query';

import { useEventStream } from '@/shared/api/use-event-stream';
import { useSessionStore } from '@/shared/stores/session-store';

import { messagingKeys } from '../data/messaging.keys';
import { useMessagingStreamStore } from '../stores/messaging-stream-store';

const MESSAGING_EVENTS = new Set(['message.created', 'conversation.read', 'relationship.changed', 'request.accepted', 'request.deleted']);

/**
 * One `GET /messaging/events` stream for the whole app while signed in. Events carry no message
 * text, only a hint, so each one refetches the active messaging queries. While the stream is not
 * healthy the queries fall back to polling (see `use-messaging.ts`).
 */
export function useMessagingStream() {
  const queryClient = useQueryClient();
  const token = useSessionStore((state) => state.accessToken);
  const setLive = useMessagingStreamStore((state) => state.setLive);
  const refetch = () => void queryClient.invalidateQueries({ queryKey: messagingKeys.all });

  useEventStream({
    path: '/messaging/events',
    enabled: !!token,
    onLive: setLive,
    onReconcile: refetch,
    onEvent: (event, payload) => {
      if (!MESSAGING_EVENTS.has(event)) return;
      // Deleted on this account (maybe from another device): the cached history must not come back.
      const id = typeof payload === 'object' && payload !== null && 'conversationId' in payload ? payload.conversationId : null;
      if (event === 'request.deleted' && typeof id === 'string') queryClient.removeQueries({ queryKey: messagingKeys.messages(id) });
      refetch();
    },
  });
}
