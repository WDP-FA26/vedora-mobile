import { feedPostSchema } from '@/features/feed/types/feed.schema';
import { apiClient } from '@/shared/api/api-client';
import { requestJson } from '@/shared/api/request-json';

import { commentFormSchema, commentPageSchema, commentSchema, reportFormSchema, type ReportInput } from '../types/posts.schema';

export function getPost(postId: string, signal?: AbortSignal) {
  return requestJson(feedPostSchema, { method: 'GET', url: `/posts/${postId}`, signal });
}

export function getCommentPage({ postId, cursor, signal }: { postId: string; cursor: string | null; signal?: AbortSignal }) {
  return requestJson(commentPageSchema, {
    method: 'GET',
    url: `/posts/${postId}/comments`,
    params: cursor ? { cursor } : undefined,
    signal,
  });
}

export function createComment(postId: string, body: string) {
  return requestJson(commentSchema, {
    method: 'POST',
    url: `/posts/${postId}/comments`,
    data: commentFormSchema.parse({ body }),
  });
}

export function updateComment(postId: string, commentId: string, body: string) {
  return requestJson(commentSchema, {
    method: 'PATCH',
    url: `/posts/${postId}/comments/${commentId}`,
    data: commentFormSchema.parse({ body }),
  });
}

export async function deleteComment(postId: string, commentId: string) {
  await apiClient.delete(`/posts/${postId}/comments/${commentId}`);
}

export async function reportPost(postId: string, input: ReportInput) {
  const { reason, details } = reportFormSchema.parse(input);
  await apiClient.post(`/posts/${postId}/report`, { reason, ...(details ? { details } : {}) });
}
