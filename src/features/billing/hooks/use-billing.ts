import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useIsFocused } from 'expo-router';
import { useEffect, useRef } from 'react';

import { useSessionStore } from '@/shared/stores/session-store';

import { billingKeys } from '../data/billing.keys';
import { cancelPayment, createPayment, getBilling, getCatalog, getPayment } from '../services/billing.service';
import { paymentIdSchema, type PlanCode } from '../types/billing.schema';
import { createPaymentAttempts } from '../utils/payment-attempts';

// shortcut: retry keys live until app restart; the server also reuses the account's pending intent.
const attempts = createPaymentAttempts();

export function useBilling() {
  const token = useSessionStore((state) => state.accessToken);
  const focused = useIsFocused();
  const enabled = !!token && focused;
  const catalog = useQuery({ queryKey: billingKeys.catalog, queryFn: ({ signal }) => getCatalog(signal), enabled });
  const overview = useQuery({ queryKey: billingKeys.overview, queryFn: ({ signal }) => getBilling(signal), enabled, refetchInterval: 30_000 });
  return { catalog, overview };
}

export function usePayment(id: string) {
  const token = useSessionStore((state) => state.accessToken);
  const focused = useIsFocused();
  const client = useQueryClient();
  const payment = useQuery({
    queryKey: billingKeys.payment(id),
    queryFn: ({ signal }) => getPayment(id, signal),
    enabled: !!token && focused && paymentIdSchema.safeParse(id).success,
    retry: false,
    refetchInterval: (query) => {
      const status = query.state.error;
      if (status && 'status' in status && [401, 403, 404].includes(Number(status.status))) return false;
      return query.state.data?.status === 'PENDING' ? 4_000 : false;
    },
  });
  const status = payment.data?.status;
  useEffect(() => {
    if (status === 'SUCCEEDED' || status === 'CANCELLED') void client.invalidateQueries({ queryKey: billingKeys.overview });
  }, [client, status]);
  return payment;
}

export function useBillingActions() {
  const client = useQueryClient();
  const token = useSessionStore((state) => state.accessToken);
  const request = useRef<AbortController | null>(null);
  useEffect(() => () => request.current?.abort(), [token]);
  function controller() {
    request.current?.abort();
    request.current = new AbortController();
    return request.current;
  }
  const create = useMutation({
    networkMode: 'always', retry: false,
    mutationFn: async (plan: PlanCode) => {
      if (!token) throw new Error('Session required');
      const key = attempts.get(token, plan);
      const result = await createPayment(plan, key, controller().signal);
      if (useSessionStore.getState().accessToken !== token) throw new Error('Session changed');
      attempts.complete(token, plan, key);
      return result;
    },
    onSuccess: (payment) => {
      if (useSessionStore.getState().accessToken !== token) return;
      client.setQueryData(billingKeys.payment(payment.id), payment);
      void client.invalidateQueries({ queryKey: billingKeys.overview });
    },
    onError: () => {
      if (useSessionStore.getState().accessToken === token) void client.invalidateQueries({ queryKey: billingKeys.overview });
    },
  });
  const cancel = useMutation({
    networkMode: 'always', retry: false,
    mutationFn: (id: string) => cancelPayment(id, controller().signal),
    onSettled: (payment, _error, id) => {
      if (useSessionStore.getState().accessToken !== token) return;
      if (payment) client.setQueryData(billingKeys.payment(id), payment);
      void client.invalidateQueries({ queryKey: billingKeys.all });
    },
  });
  return { create, cancel };
}
