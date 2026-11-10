import { fetch as streamFetch } from 'expo/fetch';

import { API_BASE_URL } from '@/shared/config/env';

export type EventStreamMessage = { event: string; data: string };

/** The server refused the stream; `status` tells the caller whether retrying can help (401/403/404 cannot). */
export class EventStreamHttpError extends Error {
  constructor(readonly status: number) {
    super(`event stream failed (${status})`);
  }
}

/**
 * Reads a Server-Sent Events endpoint with a Bearer header (`EventSource` cannot send one) until the
 * server closes it or `signal` aborts. Resolves on a clean close; throws `EventStreamHttpError` for a
 * non-2xx answer. Every frame, including heartbeats, reaches `onMessage`, so callers can run a watchdog.
 */
export async function readEventStream({ path, token, signal, onOpen, onMessage }: {
  path: string;
  token: string;
  signal: AbortSignal;
  onOpen?: () => void;
  onMessage: (message: EventStreamMessage) => void;
}) {
  const response = await streamFetch(`${API_BASE_URL}${path}`, {
    headers: { Authorization: `Bearer ${token}`, Accept: 'text/event-stream' },
    signal,
  });
  if (!response.ok) throw new EventStreamHttpError(response.status);
  if (!response.body) throw new Error('event stream has no body');
  onOpen?.();

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let event = 'message';
  let data: string[] = [];

  function dispatch() {
    if (data.length > 0 || event !== 'message') onMessage({ event, data: data.join('\n') });
    event = 'message';
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
      else if (line.startsWith('event:')) event = line.slice(6).trim();
      else if (line.startsWith('data:')) data.push(line.slice(5).replace(/^ /, ''));
      newline = buffer.indexOf('\n');
    }
  }
}
