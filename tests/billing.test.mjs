import assert from 'node:assert/strict';
import test from 'node:test';

import { catalogSchema, overviewSchema, paymentSchema } from '../src/features/billing/types/billing.schema.ts';
import { createPaymentAttempts } from '../src/features/billing/utils/payment-attempts.ts';
import { dateTime, money } from '../src/features/billing/utils/billing-format.ts';

const payment = {
  id: 'a07762f9-d469-4be6-9cb4-4018ed2b92a9', planCode: 'PRO', amount: '5000', currency: 'VND', durationDays: 30,
  status: 'PENDING', invoiceNumber: 'VED-invoice', paymentCode: 'VED7K9P2X',
  createdAt: '2026-11-07T00:00:00Z', paidAt: null, capturedAt: null, cancelledAt: null,
  qr: {
    bankCode: 'VCB', bankGateway: 'Vietcombank', accountNumber: '000123', accountHolder: 'TEST ACCOUNT',
    storeName: 'Vedora', transferContent: 'VED7K9P2X', amount: '5000', currency: 'VND',
    imageUrl: 'https://vietqr.app/qr.png', downloadUrl: 'https://vietqr.app/download.png',
  },
};

test('accepts server prices and FREE membership without hardcoding advertised amounts', () => {
  assert.equal(catalogSchema.parse({ paymentsEnabled: false, plans: [{ code: 'PRO', name: 'Pro', priceVnd: '5000', durationDays: 30 }] }).plans[0].priceVnd, '5000');
  assert.equal(overviewSchema.parse({ membership: { planCode: 'FREE', startsAt: null, expiresAt: null }, pendingPayment: payment, recentPayments: [payment] }).pendingPayment.qr.accountNumber, '000123');
});

test('rejects invalid amounts, unexpected statuses and untrusted QR origins', () => {
  for (const amount of ['-5000', '5.5', '0', '9007199254740992']) assert.equal(paymentSchema.safeParse({ ...payment, amount, qr: null }).success, false);
  assert.equal(paymentSchema.safeParse({ ...payment, status: 'PAID' }).success, false);
  for (const imageUrl of ['http://vietqr.app/qr.png', 'https://vietqr.app.evil.example/qr.png', 'javascript:alert(1)']) {
    assert.equal(paymentSchema.safeParse({ ...payment, qr: { ...payment.qr, imageUrl } }).success, false);
  }
});

test('QR must match the pending amount; terminal responses carry no payable QR', () => {
  assert.equal(paymentSchema.safeParse({ ...payment, qr: { ...payment.qr, amount: '49000' } }).success, false);
  assert.equal(paymentSchema.safeParse({ ...payment, status: 'SUCCEEDED' }).success, false);
  for (const status of ['SUCCEEDED', 'CANCELLED']) assert.equal(paymentSchema.safeParse({ ...payment, status, qr: null }).success, true);
  assert.equal(paymentSchema.safeParse({ ...payment, qr: null }).success, true);
});

test('a failed purchase retains its retry key; confirmed responses allow a new purchase', () => {
  const attempts = createPaymentAttempts();
  const key = attempts.get('session-a', 'PRO');
  assert.match(key, /^[A-Za-z0-9._:-]{8,200}$/);
  assert.equal(attempts.get('session-a', 'PRO'), key);
  assert.notEqual(attempts.get('session-a', 'PREMIUM'), key);
  attempts.complete('session-a', 'PRO', key);
  assert.notEqual(attempts.get('session-a', 'PRO'), key);
});

test('retry keys are isolated across sessions, including delayed old responses', () => {
  const attempts = createPaymentAttempts();
  const old = attempts.get('session-a', 'PRO');
  const current = attempts.get('session-b', 'PRO');
  assert.notEqual(old, current);
  attempts.complete('session-a', 'PRO', old);
  assert.equal(attempts.get('session-b', 'PRO'), current);
});

test('displays exact VND amounts and Vietnamese time regardless of device timezone', () => {
  assert.match(money('99000'), /99\.000/);
  assert.match(dateTime('2026-11-07T00:00:00Z'), /07:00/);
});
