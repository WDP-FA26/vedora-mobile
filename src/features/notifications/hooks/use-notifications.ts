import { useInfiniteQuery, useMutation, useQuery, useQueryClient, type InfiniteData } from '@tanstack/react-query';

import { useSessionStore } from '@/shared/stores/session-store';

import { notificationKeys } from '../data/notification.keys';
import { getNotificationPage, getUnreadCount, markAllNotificationsRead, markNotificationRead } from '../services/notification.service';
import type { NotificationPage } from '../types/notification.schema';

export function useNotifications() {
  const token = useSessionStore((state) => state.accessToken);
  return useInfiniteQuery({
    queryKey: notificationKeys.list,
    initialPageParam: null as string | null,
    queryFn: ({ pageParam, signal }) => getNotificationPage({ cursor: pageParam, signal }),
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled: !!token,
  });
}

export function useUnreadCount() {
  const token = useSessionStore((state) => state.accessToken);
  return useQuery({
    queryKey: notificationKeys.unread,
    queryFn: ({ signal }) => getUnreadCount(signal),
    enabled: !!token,
  });
}

export function useMarkRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: markNotificationRead,
    onMutate: (id) => {
      const readAt = new Date().toISOString();
      let wasUnread = false;
      queryClient.setQueryData<InfiniteData<NotificationPage, string | null>>(notificationKeys.list, (previous) => previous && {
        ...previous,
        pages: previous.pages.map((page) => ({
          ...page,
          items: page.items.map((item) => {
            if (item.id !== id || item.readAt) return item;
            wasUnread = true;
            return { ...item, readAt };
          }),
        })),
      });
      if (wasUnread) queryClient.setQueryData<number>(notificationKeys.unread, (count) => Math.max(0, (count ?? 1) - 1));
    },
    onSettled: () => void queryClient.invalidateQueries({ queryKey: notificationKeys.unread }),
  });
}

export function useMarkAllRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => {
      const readAt = new Date().toISOString();
      queryClient.setQueryData<InfiniteData<NotificationPage, string | null>>(notificationKeys.list, (previous) => previous && {
        ...previous,
        pages: previous.pages.map((page) => ({ ...page, items: page.items.map((item) => item.readAt ? item : { ...item, readAt }) })),
      });
      queryClient.setQueryData<number>(notificationKeys.unread, 0);
    },
  });
}
