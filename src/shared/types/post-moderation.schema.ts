import { z } from 'zod';

export const postStatusSchema = z.enum(['DRAFT', 'PROCESSING', 'PUBLISHED', 'FAILED', 'PENDING_REVIEW', 'REJECTED', 'REMOVED']);

/** Common response fields for posts and blogs; older responses may omit the evidence. */
export const postModerationShape = {
  status: postStatusSchema,
  moderationVerdict: z.string().nullable().optional(),
  moderationReason: z.string().nullable().optional(),
  moderationFindings: z.array(z.object({
    field: z.string(), quote: z.string().nullable(), reason: z.string(), reasonText: z.string().nullable(),
    mediaId: z.string().nullable(), seconds: z.number().nullable(),
  })).optional(),
  removalReason: z.string().nullable().optional(),
  appeal: z.object({
    activeTicket: z.object({ id: z.string() }).nullable(),
    latestTicket: z.object({ id: z.string() }).nullable().optional(),
    canAppeal: z.boolean().optional(),
    deadlineAt: z.string().nullable().optional(),
    blockedReason: z.string().nullable().optional(),
  }).nullable().optional(),
};

export const postModerationSchema = z.object(postModerationShape);
export type PostModeration = z.output<typeof postModerationSchema>;
