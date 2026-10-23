import { fetch as streamFetch } from 'expo/fetch';

import { apiClient } from '@/shared/api/api-client';
import { requestJson } from '@/shared/api/request-json';
import { API_BASE_URL } from '@/shared/config/env';

import { notificationPageSchema, notificationSchema, unreadCountSchema, type AppNotification } from '../types/notification.schema';

export function getNotificationPage({ cursor, signal }: { cursor: string | null; signal?: AbortSignal }) {
  return requestJson(notificationPageSchema, {
    method: 'GET',
    url: '/notifications',
    params: { limit: 30, ...(cursor ? { cursor } : {}) },
    signal,
  });
}

export async function getUnreadCount(signal?: AbortSignal) {
  return (await requestJson(unreadCountSchema, { method: 'GET', url: '/notifications/unread-count', signal })).unreadCount;
}

export async function markNotificationRead(id: string) {
  await apiClient.post(`/notifications/${id}/read`);
}

export async function markAllNotificationsRead() {
  await apiClient.post('/notifications/read');
}

export class StreamAuthError extends Error {}

/**
 * Reads `GET /notifications/sse` with the Bearer token until it ends or `signal` aborts.
 * Resolves when the server closes the stream; throws `StreamAuthError` on 401 so the
 * caller can wait for a refreshed token instead of hammering the endpoint.
 */
export async function readNotificationStream({ token, signal, onOpen, onNotification }: {
  token: string;
  signal: AbortSignal;
  onOpen: () => void;
  onNotification: (notification: AppNotification) => void;
}) {
  const response = await streamFetch(`${API_BASE_URL}/notifications/sse`, {
    headers: { Authorization: `Bearer ${token}`, Accept: 'text/event-stream' },
    signal,
  });
  if (response.status === 401) throw new StreamAuthError('unauthorized');
  if (!response.ok || !response.body) throw new Error(`notification stream failed (${response.status})`);
  onOpen();

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let eventName = 'message';
  let data: string[] = [];

  function dispatch() {
    if (eventName === 'notification' && data.length > 0) {
      try {
        const parsed = notificationSchema.safeParse(JSON.parse(data.join('\n')));
        if (parsed.success) onNotification(parsed.data);
      } catch {
        // Malformed frame: skip it, keep the stream.
      }
    }
    eventName = 'message';
    data = [];
  }

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let newline = buffer.indexOf('\n');
    while (newline !== -1) {
      const line = buffer.slice(0, newline).replace(/\r$/, '');
      buffer = buffer.slice(newline + 1);
      if (line === '') dispatch();
      else if (line.startsWith('event:')) eventName = line.slice(6).trim();
      else if (line.startsWith('data:')) data.push(line.slice(5).replace(/^ /, ''));
      newline = buffer.indexOf('\n');
    }
  }
}
