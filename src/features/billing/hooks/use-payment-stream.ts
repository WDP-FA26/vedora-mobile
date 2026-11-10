import { useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';

import { useEventStream } from '@/shared/api/use-event-stream';

import { billingKeys } from '../data/billing.keys';

const changedSchema = z.object({ intentId: z.string() });

/**
 * Listens to `GET /payment-intents/:id/events` while the payment is pending. The stream is only a hint:
 * every signal invalidates the payment and billing queries so the GET stays the source of truth, and a GET
 * also runs on each (re)connect to cover events the server never replays. `onLive` reports whether the
 * stream is healthy, so the caller can slow its fallback polling down while it is.
 */
export function usePaymentStream(id: string, enabled: boolean, onLive: (live: boolean) => void) {
  const queryClient = useQueryClient();
  const reconcile = () => {
    void queryClient.invalidateQueries({ queryKey: billingKeys.payment(id) });
    void queryClient.invalidateQueries({ queryKey: billingKeys.overview });
  };

  useEventStream({
    path: `/payment-intents/${id}/events`,
    enabled,
    onLive,
    onReconcile: reconcile,
    onEvent: (event, payload) => {
      if (event !== 'payment.changed') return;
      const changed = changedSchema.safeParse(payload);
      if (changed.success && changed.data.intentId === id) reconcile();
    },
  });
}
