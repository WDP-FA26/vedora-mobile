import { z } from 'zod';

/** Plans a member can buy now. */
export const planCodeSchema = z.enum(['PLUS', 'PRO']);
/** Old purchases can still carry the retired PREMIUM code in the history. */
const historyPlanSchema = z.enum(['PLUS', 'PRO', 'PREMIUM']);
/** Catalogue version the app understands; the API refuses a purchase without it. */
export const PLAN_VERSION = 2;
const moneySchema = z.string().regex(/^[1-9]\d*$/).refine((value) => Number.isSafeInteger(Number(value)));
const qrUrlSchema = z.url().refine((value) => new URL(value).origin === 'https://vietqr.app')
  .transform((value) => value as `https://${string}`);
export const paymentIdSchema = z.uuid();
export const paymentSchema = z.object({
  id: paymentIdSchema,
  planCode: historyPlanSchema,
  planVersion: z.number().int().optional(),
  /** The plan's name when it was bought, e.g. "Pro (gói cũ)" for history. */
  purchasedPlanName: z.string().optional(),
  textLimit: z.number().int().nonnegative().optional(),
  imageLimit: z.number().int().nonnegative().optional(),
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
  planVersion: z.number().int(),
  paymentsEnabled: z.boolean(),
  freeLimits: z.object({ textLimit: z.number().int().nonnegative(), imageLimit: z.number().int().nonnegative() }),
  plans: z.array(z.object({
    code: planCodeSchema, name: z.string(), priceVnd: moneySchema, durationDays: z.number().int().positive(),
    textLimit: z.number().int().nonnegative(), imageLimit: z.number().int().nonnegative(),
  })),
});
const allowanceSchema = z.object({
  used: z.number().int().nonnegative(),
  limit: z.number().int().nonnegative(),
  remaining: z.number().int().nonnegative(),
  resetsAt: z.iso.datetime(),
  period: z.enum(['DAY', 'CYCLE']),
});
export const overviewSchema = z.object({
  membership: z.object({
    planCode: z.enum(['FREE', 'PLUS', 'PRO', 'PREMIUM']),
    startsAt: z.iso.datetime().nullable(), expiresAt: z.iso.datetime().nullable(),
  }),
  usage: z.object({ text: allowanceSchema, images: allowanceSchema }),
  pendingPayment: paymentSchema.nullable(),
  recentPayments: z.array(paymentSchema),
});
export type PlanCode = z.output<typeof planCodeSchema>;
export type Plan = z.output<typeof catalogSchema>['plans'][number];
export type Allowance = z.output<typeof allowanceSchema>;
export type Catalog = z.output<typeof catalogSchema>;
export type Payment = z.output<typeof paymentSchema>;
