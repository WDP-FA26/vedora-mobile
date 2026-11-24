import { z } from 'zod';

import { feedPostSchema } from '@/features/feed/types/feed.schema';

export const MAX_COMMENT_LENGTH = 1000;
export const MAX_REPORT_DETAILS_LENGTH = 500;
export const MAX_REPORT_IMAGES = 3;
export const MAX_REPORT_IMAGE_MB = 5;
export const reportEvidenceInputSchema = z.object({
  contentType: z.enum(['image/jpeg', 'image/png', 'image/webp'], 'Chỉ hỗ trợ ảnh JPG, PNG hoặc WebP.'),
  sizeBytes: z.number().int().positive('Không đọc được ảnh đã chọn.').max(MAX_REPORT_IMAGE_MB * 1048576, `Ảnh tối đa ${MAX_REPORT_IMAGE_MB} MB.`),
});
export const reportEvidenceResponseSchema = z.object({ id: z.uuidv4() });
/** Mirrors the API's MAX_SEARCH_QUERY_LENGTH. */
export const MAX_SEARCH_QUERY_LENGTH = 200;

export const commentSchema = z.object({
  id: z.string(),
  postId: z.string(),
  parentId: z.string().nullable().default(null),
  replyToId: z.string().nullable().default(null),
  replyToAuthor: feedPostSchema.shape.author.nullable().default(null),
  replyCount: z.number().int().nonnegative().default(0),
  body: z.string(),
  author: feedPostSchema.shape.author,
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const commentPageSchema = z.object({
  items: z.array(commentSchema),
  nextCursor: z.string().nullable(),
});

export const commentFormSchema = z.object({
  body: z.string().trim().min(1, 'Viết vài chữ trước khi gửi').max(MAX_COMMENT_LENGTH, `Tối đa ${MAX_COMMENT_LENGTH} ký tự`),
});

export const REPORT_REASONS = ['SPAM', 'HARASSMENT', 'MISINFORMATION', 'HARMFUL_ADVICE', 'NOT_PLANT_BASED', 'INAPPROPRIATE', 'OTHER'] as const;
export type ReportReason = (typeof REPORT_REASONS)[number];

export const REPORT_REASON_LABELS: Record<ReportReason, string> = {
  SPAM: 'Spam hoặc quảng cáo',
  HARASSMENT: 'Quấy rối, công kích người khác',
  MISINFORMATION: 'Thông tin sai lệch',
  HARMFUL_ADVICE: 'Lời khuyên ăn uống, sức khoẻ có thể gây hại',
  NOT_PLANT_BASED: 'Món ăn hoặc nội dung không thuần thực vật',
  INAPPROPRIATE: 'Nội dung phản cảm',
  OTHER: 'Lý do khác',
};

export const reportFormSchema = z.object({
  reason: z.enum(REPORT_REASONS, 'Chọn một lý do'),
  details: z.string().trim().max(MAX_REPORT_DETAILS_LENGTH, `Tối đa ${MAX_REPORT_DETAILS_LENGTH} ký tự`),
  evidenceIds: z.array(z.uuidv4()).max(MAX_REPORT_IMAGES, `Tối đa ${MAX_REPORT_IMAGES} ảnh minh chứng.`).refine((ids) => new Set(ids).size === ids.length, 'Ảnh minh chứng bị trùng.').default([]),
}).refine((values) => values.reason !== 'OTHER' || values.details !== '', {
  path: ['details'],
  message: 'Mô tả ngắn gọn vấn đề của bài viết',
});

export type Comment = z.output<typeof commentSchema>;
export type CommentPage = z.output<typeof commentPageSchema>;
export type ReportInput = z.output<typeof reportFormSchema>;

// Comment reports accept text only; post evidence IDs are not part of this API.
export const commentReportFormSchema = z.object({
  reason: z.enum(REPORT_REASONS, 'Chọn một lý do'),
  details: z.string().trim().max(MAX_REPORT_DETAILS_LENGTH, `Tối đa ${MAX_REPORT_DETAILS_LENGTH} ký tự`),
}).strict();
export const commentReportReceiptSchema = z.object({
  id: z.uuidv4(), postId: z.uuidv4(), commentId: z.uuidv4(), reason: z.enum(REPORT_REASONS),
  details: z.string().nullable(), status: z.enum(['PENDING', 'RESOLVED', 'DISMISSED']), createdAt: z.string(),
});
export type CommentReportInput = z.output<typeof commentReportFormSchema>;
