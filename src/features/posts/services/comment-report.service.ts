import { z } from 'zod';

import { requestJson } from '@/shared/api/request-json';

import { commentReportFormSchema, commentReportReceiptSchema, type CommentReportInput } from '../types/posts.schema';

export function reportComment(postId: string, commentId: string, input: CommentReportInput) {
  const { reason, details } = commentReportFormSchema.parse(input);
  return requestJson(commentReportReceiptSchema, {
    method: 'POST', url: `/posts/${z.uuidv4().parse(postId)}/comments/${z.uuidv4().parse(commentId)}/report`,
    data: { reason, ...(details ? { details } : {}) },
  });
}
