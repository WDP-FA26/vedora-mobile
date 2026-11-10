import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { z } from 'zod';

import { refreshSession } from '@/shared/session/session-manager';
import { useSessionStore } from '@/shared/stores/session-store';

import { EventStreamHttpError, readEventStream } from './event-stream';

const RETRY_DELAY_MS = 2_000;
// The API pings every 15s; silence for longer means a half-open connection.
const SILENCE_LIMIT_MS = 35_000;
const WATCHDOG_MS = 5_000;
const pingSchema = z.object({ connected: z.boolean() });

type EventStreamOptions = {
  path: string;
  enabled: boolean;
  /** Reports whether the stream is healthy, so callers can slow their fallback polling. */
  onLive: (live: boolean) => void;
  /** Runs on every (re)connect and on `stream.ready`: refetch to cover events the server never replays. */
  onReconcile: () => void;
  /** Any other event, with its parsed JSON payload (`null` when it is not valid JSON). */
  onEvent: (event: string, payload: unknown) => void;
};

/**
 * Keeps one Bearer-authenticated SSE connection open to an API stream that uses the shared
 * vocabulary (`stream.ready`, `stream.unavailable`, `ping`, `session.expired`). The stream is
 * only a hint; callers refetch on events. Reconnects after errors or silence, pauses while the
 * app is in the background, and follows the access token (a refreshed token reopens the stream).
 */
export function useEventStream(options: EventStreamOptions) {
  const token = useSessionStore((state) => state.accessToken);
  const latest = useRef(options);
  const { path, enabled } = options;
  // Keep the newest callbacks without re-opening the stream; declared before the connection effect so it runs first.
  useEffect(() => {
    latest.current = options;
  });

  useEffect(() => {
    if (!enabled || !token) return;
    const accessToken: string = token;
    let controller: AbortController | null = null;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;
    let watchdog: ReturnType<typeof setInterval> | null = null;
    let stopped = false;

    const live = (value: boolean) => latest.current.onLive(value);

    function stop() {
      if (retryTimer) clearTimeout(retryTimer);
      if (watchdog) clearInterval(watchdog);
      retryTimer = null;
      watchdog = null;
      controller?.abort();
      controller = null;
      live(false);
    }

    function start() {
      if (stopped || controller) return;
      const current = new AbortController();
      controller = current;
      let lastFrame = Date.now();
      let fatal = false;
      watchdog = setInterval(() => {
        if (Date.now() - lastFrame > SILENCE_LIMIT_MS) {
          live(false);
          current.abort();
        }
      }, WATCHDOG_MS);

      readEventStream({
        path,
        token: accessToken,
        signal: current.signal,
        onOpen: () => {
          lastFrame = Date.now();
          latest.current.onReconcile();
        },
        onMessage: ({ event, data }) => {
          lastFrame = Date.now();
          if (event === 'stream.ready') { live(true); latest.current.onReconcile(); return; }
          if (event === 'stream.unavailable') { live(false); return; }
          if (event === 'session.expired') {
            fatal = true;
            live(false);
            current.abort();
            // A new token re-runs this effect and reopens the stream.
            void refreshSession().catch(() => undefined);
            return;
          }
          let payload: unknown = null;
          try { payload = JSON.parse(data); } catch { /* Malformed frame: the refetch stays authoritative. */ }
          if (event === 'ping') {
            const ping = pingSchema.safeParse(payload);
            if (ping.success) live(ping.data.connected);
            return;
          }
          latest.current.onEvent(event, payload);
        },
      })
        .catch((error: unknown) => {
          // 401 waits for a refreshed token; 403/404 mean this stream is not ours. Neither is worth retrying.
          if (error instanceof EventStreamHttpError) {
            if (error.status === 401) void refreshSession().catch(() => undefined);
            if ([401, 403, 404].includes(error.status)) fatal = true;
          }
        })
        .finally(() => {
          if (watchdog) clearInterval(watchdog);
          watchdog = null;
          if (controller === current) controller = null;
          live(false);
          if (stopped || fatal) return;
          retryTimer = setTimeout(() => {
            retryTimer = null;
            if (AppState.currentState === 'active') start();
          }, RETRY_DELAY_MS);
        });
    }

    if (AppState.currentState === 'active') start();
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        start();
        latest.current.onReconcile(); // Whatever happened while the app was in the background.
      } else {
        stop();
      }
    });

    return () => {
      stopped = true;
      subscription.remove();
      stop();
    };
  }, [enabled, path, token]);
}
