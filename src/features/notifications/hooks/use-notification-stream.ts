import { useQueryClient, type InfiniteData } from '@tanstack/react-query';
import { useEffect } from 'react';
import { AppState } from 'react-native';

import { useSessionStore } from '@/shared/stores/session-store';

import { notificationKeys } from '../data/notification.keys';
import { readNotificationStream, StreamAuthError } from '../services/notification.service';
import type { NotificationPage } from '../types/notification.schema';

const RETRY_DELAY_MS = 5_000;

/**
 * Keeps one SSE connection open while the user is signed in and the app is in the foreground,
 * and puts each pushed notification into the Query caches. Follows the access token (a
 * refreshed token reopens the stream). Missed items are covered by refetching on every open.
 */
export function useNotificationStream() {
  const queryClient = useQueryClient();
  const token = useSessionStore((state) => state.accessToken);

  useEffect(() => {
    if (!token) return;
    let controller: AbortController | null = null;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;
    let stopped = false;

    function stop() {
      if (retryTimer) clearTimeout(retryTimer);
      retryTimer = null;
      controller?.abort();
      controller = null;
    }

    function start() {
      if (stopped || controller || !token) return;
      const current = new AbortController();
      controller = current;
      readNotificationStream({
        token,
        signal: current.signal,
        onOpen: () => {
          void queryClient.invalidateQueries({ queryKey: notificationKeys.unread });
          void queryClient.invalidateQueries({ queryKey: notificationKeys.list });
        },
        onNotification: (incoming) => {
          queryClient.setQueryData<InfiniteData<NotificationPage, string | null>>(notificationKeys.list, (previous) => {
            if (!previous || previous.pages.some((page) => page.items.some((item) => item.id === incoming.id))) return previous;
            const [first, ...rest] = previous.pages;
            return { ...previous, pages: [{ ...first, items: [incoming, ...first.items] }, ...rest] };
          });
          queryClient.setQueryData<number>(notificationKeys.unread, (count) => (count ?? 0) + 1);
        },
      })
        .then(
          () => true,
          (error: unknown) => !(error instanceof StreamAuthError),
        )
        .then((shouldRetry) => {
          if (controller === current) controller = null;
          if (stopped || current.signal.aborted || !shouldRetry) return;
          // The server closed the stream or it failed: reconnect after a pause.
          retryTimer = setTimeout(() => {
            retryTimer = null;
            if (AppState.currentState === 'active') start();
          }, RETRY_DELAY_MS);
        });
    }

    if (AppState.currentState === 'active') start();
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') start();
      else stop();
    });

    return () => {
      stopped = true;
      subscription.remove();
      stop();
    };
  }, [queryClient, token]);
}
