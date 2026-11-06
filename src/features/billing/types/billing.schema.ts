import { z } from 'zod';

export const planCodeSchema = z.enum(['PRO', 'PREMIUM']);
const moneySchema = z.string().regex(/^[1-9]\d*$/).refine((value) => Number.isSafeInteger(Number(value)));
const qrUrlSchema = z.url().refine((value) => new URL(value).origin === 'https://vietqr.app')
  .transform((value) => value as `https://${string}`);
export const paymentIdSchema = z.uuid();
export const paymentSchema = z.object({
  id: paymentIdSchema,
  planCode: planCodeSchema,
  durationDays: z.number().int().positive(),
  amount: moneySchema,
  currency: z.literal('VND'),
  status: z.enum(['PENDING', 'SUCCEEDED', 'CANCELLED']),
  invoiceNumber: z.string(),
  paymentCode: z.string(),
  createdAt: z.iso.datetime(),
  paidAt: z.iso.datetime().nullable(),
  capturedAt: z.iso.datetime().nullable(),
  cancelledAt: z.iso.datetime().nullable(),
  qr: z.object({
    bankCode: z.string(), bankGateway: z.string(), accountNumber: z.string(),
    accountHolder: z.string(), storeName: z.string(), transferContent: z.string(),
    amount: moneySchema, currency: z.literal('VND'), imageUrl: qrUrlSchema, downloadUrl: qrUrlSchema,
  }).nullable(),
}).superRefine((payment, context) => {
  if (payment.qr && (payment.status !== 'PENDING' || payment.qr.amount !== payment.amount)) {
    context.addIssue({ code: 'custom', path: ['qr'], message: 'QR does not match the pending payment snapshot' });
  }
});
export const catalogSchema = z.object({
  paymentsEnabled: z.boolean(),
  plans: z.array(z.object({ code: planCodeSchema, name: z.string(), priceVnd: moneySchema, durationDays: z.number().int().positive() })),
});
export const overviewSchema = z.object({
  membership: z.object({
    planCode: z.enum(['FREE', 'PRO', 'PREMIUM']),
    startsAt: z.iso.datetime().nullable(), expiresAt: z.iso.datetime().nullable(),
  }),
  pendingPayment: paymentSchema.nullable(),
  recentPayments: z.array(paymentSchema),
});
export type PlanCode = z.output<typeof planCodeSchema>;
export type Plan = z.output<typeof catalogSchema>['plans'][number];
export type Payment = z.output<typeof paymentSchema>;
