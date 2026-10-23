import { z } from 'zod';

import { feedPostSchema } from '@/features/feed/types/feed.schema';

export const MAX_COMMENT_LENGTH = 1000;
export const MAX_REPORT_DETAILS_LENGTH = 500;

export const commentSchema = z.object({
  id: z.string(),
  postId: z.string(),
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

export const REPORT_REASONS = ['SPAM', 'HARASSMENT', 'MISINFORMATION', 'HARMFUL_ADVICE', 'INAPPROPRIATE', 'OTHER'] as const;
export type ReportReason = (typeof REPORT_REASONS)[number];

export const REPORT_REASON_LABELS: Record<ReportReason, string> = {
  SPAM: 'Spam hoặc quảng cáo',
  HARASSMENT: 'Quấy rối, công kích người khác',
  MISINFORMATION: 'Thông tin sai lệch',
  HARMFUL_ADVICE: 'Lời khuyên ăn uống, sức khoẻ có thể gây hại',
  INAPPROPRIATE: 'Nội dung phản cảm',
  OTHER: 'Lý do khác',
};

export const reportFormSchema = z.object({
  reason: z.enum(REPORT_REASONS, 'Chọn một lý do'),
  details: z.string().trim().max(MAX_REPORT_DETAILS_LENGTH, `Tối đa ${MAX_REPORT_DETAILS_LENGTH} ký tự`),
}).refine((values) => values.reason !== 'OTHER' || values.details !== '', {
  path: ['details'],
  message: 'Mô tả ngắn gọn vấn đề của bài viết',
});

export type Comment = z.output<typeof commentSchema>;
export type CommentPage = z.output<typeof commentPageSchema>;
export type ReportInput = z.output<typeof reportFormSchema>;
