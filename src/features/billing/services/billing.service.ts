import { requestJson } from '@/shared/api/request-json';

import { catalogSchema, overviewSchema, paymentIdSchema, paymentSchema, planCodeSchema, type PlanCode } from '../types/billing.schema';

export function getCatalog(signal?: AbortSignal) {
  return requestJson(catalogSchema, { method: 'GET', url: '/billing/plans', signal });
}
export function getBilling(signal?: AbortSignal) {
  return requestJson(overviewSchema, { method: 'GET', url: '/billing/me', signal });
}
export function getPayment(id: string, signal?: AbortSignal) {
  return requestJson(paymentSchema, { method: 'GET', url: `/payment-intents/${paymentIdSchema.parse(id)}`, signal });
}
export function createPayment(planCode: PlanCode, key: string, signal?: AbortSignal) {
  return requestJson(paymentSchema, {
    method: 'POST', url: '/billing/payment-intents', signal,
    headers: { 'Idempotency-Key': key }, data: { planCode: planCodeSchema.parse(planCode) },
  });
}
export function cancelPayment(id: string, signal?: AbortSignal) {
  return requestJson(paymentSchema, { method: 'POST', url: `/payment-intents/${paymentIdSchema.parse(id)}/cancel`, signal });
}
