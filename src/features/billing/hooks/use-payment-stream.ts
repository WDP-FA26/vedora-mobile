import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { AppState } from 'react-native';
import { z } from 'zod';

import { EventStreamHttpError, readEventStream } from '@/shared/api/event-stream';
import { refreshSession } from '@/shared/session/session-manager';
import { useSessionStore } from '@/shared/stores/session-store';

import { billingKeys } from '../data/billing.keys';

const RETRY_DELAY_MS = 2_000;
// The server sends a ping every 15s; silence for longer means a half-open connection.
const SILENCE_LIMIT_MS = 35_000;
const WATCHDOG_MS = 5_000;

const changedSchema = z.object({ intentId: z.string() });
const pingSchema = z.object({ connected: z.boolean() });

/**
 * Listens to `GET /payment-intents/:id/events` while the payment is pending. The stream is only a hint:
 * every signal invalidates the payment and billing queries so the GET stays the source of truth, and a GET
 * also runs on each (re)connect to cover events the server never replays. `onLive` reports whether the
 * stream is healthy, so the caller can slow its fallback polling down while it is.
 */
export function usePaymentStream(id: string, enabled: boolean, onLive: (live: boolean) => void) {
  const queryClient = useQueryClient();
  const token = useSessionStore((state) => state.accessToken);

  useEffect(() => {
    if (!enabled || !token) return;
    const accessToken: string = token;
    let controller: AbortController | null = null;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;
    let watchdog: ReturnType<typeof setInterval> | null = null;
    let stopped = false;

    const reconcile = () => {
      void queryClient.invalidateQueries({ queryKey: billingKeys.payment(id) });
      void queryClient.invalidateQueries({ queryKey: billingKeys.overview });
    };

    function stop() {
      if (retryTimer) clearTimeout(retryTimer);
      if (watchdog) clearInterval(watchdog);
      retryTimer = null;
      watchdog = null;
      controller?.abort();
      controller = null;
      onLive(false);
    }

    function start() {
      if (stopped || controller) return;
      const current = new AbortController();
      controller = current;
      let lastFrame = Date.now();
      let fatal = false;
      watchdog = setInterval(() => {
        if (Date.now() - lastFrame > SILENCE_LIMIT_MS) {
          onLive(false);
          current.abort();
        }
      }, WATCHDOG_MS);

      readEventStream({
        path: `/payment-intents/${id}/events`,
        token: accessToken,
        signal: current.signal,
        onOpen: () => {
          lastFrame = Date.now();
          reconcile(); // A payment committed before the subscription was ready.
        },
        onMessage: ({ event, data }) => {
          lastFrame = Date.now();
          if (event === 'stream.ready') { onLive(true); reconcile(); return; }
          if (event === 'stream.unavailable') { onLive(false); return; }
          if (event === 'session.expired') {
            fatal = true;
            onLive(false);
            current.abort();
            // A new token re-runs this effect and reopens the stream.
            void refreshSession().catch(() => undefined);
            return;
          }
          try {
            const payload: unknown = JSON.parse(data);
            if (event === 'ping') {
              const ping = pingSchema.safeParse(payload);
              if (ping.success) onLive(ping.data.connected);
            } else if (event === 'payment.changed') {
              const changed = changedSchema.safeParse(payload);
              if (changed.success && changed.data.intentId === id) reconcile();
            }
          } catch {
            // Malformed frame: the fallback GET stays authoritative.
          }
        },
      })
        .catch((error: unknown) => {
          // 401 waits for a refreshed token; 403/404 mean this payment is not ours. Neither is worth retrying.
          if (error instanceof EventStreamHttpError) {
            if (error.status === 401) void refreshSession().catch(() => undefined);
            if ([401, 403, 404].includes(error.status)) fatal = true;
          }
        })
        .finally(() => {
          if (watchdog) clearInterval(watchdog);
          watchdog = null;
          if (controller === current) controller = null;
          onLive(false);
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
        reconcile(); // Whatever happened while the app was in the background.
      } else {
        stop();
      }
    });

    return () => {
      stopped = true;
      subscription.remove();
      stop();
    };
  }, [enabled, id, onLive, queryClient, token]);
}
