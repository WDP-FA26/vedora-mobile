import { z } from 'zod';

export const MAX_ATTACHMENTS = 4;
export const MAX_ATTACHMENT_MB = 10;
export const MAX_MESSAGE_LENGTH = 2000;
export const MAX_SUBJECT_LENGTH = 150;
export const MAX_REFERENCE_LENGTH = 100;
export const ticketCategorySchema = z.enum(['CONTENT_APPEAL', 'PAYMENT_ISSUE', 'VERIFICATION', 'GENERAL']);
export const ticketStatusSchema = z.enum(['OPEN', 'WAITING_USER', 'RESOLVED', 'CLOSED', 'WITHDRAWN', 'EXPIRED']);
export const appealReasonSchema = z.enum(['FALSE_POSITIVE', 'CONTEXT_MISUNDERSTOOD', 'NO_MANIPULATION', 'OTHER']);

const attachmentIdsSchema = z.array(z.uuidv4()).max(MAX_ATTACHMENTS, `Tối đa ${MAX_ATTACHMENTS} ảnh.`)
  .refine((ids) => new Set(ids).size === ids.length, 'Ảnh đính kèm không được trùng nhau.');
const messageText = z.string().trim().max(MAX_MESSAGE_LENGTH, `Nội dung tối đa ${MAX_MESSAGE_LENGTH} ký tự.`);
export const createTicketSchema = z.object({
  category: ticketCategorySchema,
  subject: z.string().trim().max(MAX_SUBJECT_LENGTH).optional(),
  message: messageText.min(1, 'Nhập nội dung yêu cầu.'),
  postId: z.uuidv4().optional(),
  reasonCategory: appealReasonSchema.optional(),
  referenceCode: z.string().trim().max(MAX_REFERENCE_LENGTH).optional(),
  attachmentIds: attachmentIdsSchema.optional(),
}).superRefine((input, context) => {
  if (input.category === 'CONTENT_APPEAL') {
    if (!input.postId) context.addIssue({ code: 'custom', path: ['postId'], message: 'Hãy mở khiếu nại từ bài viết bị xử lý.' });
  } else if (!input.subject) context.addIssue({ code: 'custom', path: ['subject'], message: 'Nhập tiêu đề yêu cầu.' });
});
export const replyTicketSchema = z.object({
  body: messageText.transform((value) => value || undefined).optional(),
  attachmentIds: attachmentIdsSchema.optional(),
}).refine((input) => !!input.body || !!input.attachmentIds?.length, 'Nhập nội dung hoặc thêm ảnh đính kèm.');

export const attachmentInputSchema = z.object({
  contentType: z.enum(['image/jpeg', 'image/png', 'image/webp'], { error: 'Chọn ảnh JPG, PNG hoặc WebP.' }),
  sizeBytes: z.number().int().positive('Không đọc được dung lượng ảnh.').max(MAX_ATTACHMENT_MB * 1048576, `Mỗi ảnh không quá ${MAX_ATTACHMENT_MB} MB.`),
});
export const attachmentUploadSchema = z.object({
  id: z.uuidv4(),
  upload: z.object({ url: z.url(), method: z.literal('PUT'), headers: z.record(z.string(), z.string()), expiresAt: z.string() }),
});
const attachmentSchema = z.object({ id: z.string(), url: z.url(), contentType: z.string(), sizeBytes: z.number() });
const senderSchema = z.object({ id: z.string(), fullName: z.string(), username: z.string() });
const ticketMessageSchema = z.object({
  id: z.string(), ticketId: z.string(), sender: senderSchema.nullable(), senderRole: z.enum(['USER', 'ADMIN']),
  kind: z.string(), isInternal: z.boolean(), body: z.string(), attachments: z.array(attachmentSchema), createdAt: z.string(),
});
export const ticketSchema = z.object({
  id: z.string(), code: z.string(), category: ticketCategorySchema, subject: z.string(), status: ticketStatusSchema,
  appeal: z.object({
    postId: z.string(), postType: z.enum(['POST', 'BLOG']), triggerStatus: z.enum(['REJECTED', 'REMOVED']),
    reasonCategory: appealReasonSchema, outcome: z.enum(['APPROVED', 'REJECTED']).nullable(),
    postSnapshot: z.object({ title: z.string().nullable(), excerpt: z.string().nullable(), verdict: z.string().nullable(), reason: z.string().nullable(), blockedAt: z.string() }),
  }).nullable(),
  referenceCode: z.string().nullable(), lastMessageAt: z.string(), lastMessageByRole: z.enum(['USER', 'ADMIN']), messageCount: z.number(),
  waitingUserSince: z.string().nullable(), autoCloseAt: z.string().nullable(), resolvedAt: z.string().nullable(),
  resolutionNote: z.string().nullable(), createdAt: z.string(), updatedAt: z.string(),
});
export const ticketDetailSchema = ticketSchema.extend({
  messages: z.array(ticketMessageSchema), post: z.object({ id: z.string(), type: z.enum(['POST', 'BLOG']) }).nullable(), reopenableUntil: z.string().nullable(),
});
export const ticketPageSchema = z.object({
  items: z.array(ticketSchema), meta: z.object({ page: z.number().int(), hasNextPage: z.boolean() }),
});
export type TicketCategory = z.output<typeof ticketCategorySchema>;
export type TicketStatus = z.output<typeof ticketStatusSchema>;
export type AppealReason = z.output<typeof appealReasonSchema>;
export type Ticket = z.output<typeof ticketSchema>;
export type TicketDetail = z.output<typeof ticketDetailSchema>;
export type CreateTicketInput = z.input<typeof createTicketSchema>;
export type ReplyTicketInput = z.input<typeof replyTicketSchema>;
