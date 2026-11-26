import { feedPageSchema, feedPostSchema, type FeedPost } from '@/features/feed/types/feed.schema';
import { apiClient } from '@/shared/api/api-client';
import { requestJson } from '@/shared/api/request-json';
import { z } from 'zod';

import { postUpdateSchema, type PostUpdate } from '../types/post-edit.schema';
import { MAX_SEARCH_QUERY_LENGTH, commentFormSchema, commentPageSchema, commentSchema, reportFormSchema, type ReportInput } from '../types/posts.schema';

export function getPost(postId: string, signal?: AbortSignal) {
  return requestJson(feedPostSchema, { method: 'GET', url: `/posts/${postId}`, signal });
}

export function updatePost(postId: string, input: PostUpdate) {
  return requestJson(feedPostSchema, {
    method: 'PATCH', url: `/posts/${z.uuidv4().parse(postId)}`, data: postUpdateSchema.parse(input),
  });
}

export async function deletePost(postId: string, type: FeedPost['type']) {
  await apiClient.delete(`/${type === 'BLOG' ? 'blogs' : 'posts'}/${postId}`);
}

export function getCommentPage({ postId, cursor, signal }: { postId: string; cursor: string | null; signal?: AbortSignal }) {
  return requestJson(commentPageSchema, {
    method: 'GET',
    url: `/posts/${postId}/comments`,
    params: cursor ? { cursor } : undefined,
    signal,
  });
}

export function getComment(postId: string, commentId: string, signal?: AbortSignal) {
  return requestJson(commentSchema, { method: 'GET', url: `/posts/${postId}/comments/${commentId}`, signal });
}

export function getReplyPage({ postId, rootId, cursor, signal }: { postId: string; rootId: string; cursor: string | null; signal?: AbortSignal }) {
  return requestJson(commentPageSchema, {
    method: 'GET', url: `/posts/${postId}/comments/${rootId}/replies`,
    params: cursor ? { cursor } : undefined, signal,
  });
}

export function createReply(postId: string, targetId: string, body: string) {
  return requestJson(commentSchema, {
    method: 'POST', url: `/posts/${postId}/comments/${targetId}/replies`,
    data: commentFormSchema.parse({ body }),
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
  const { reason, details, evidenceIds } = reportFormSchema.parse(input);
  await apiClient.post(`/posts/${postId}/report`, { reason, ...(details ? { details } : {}), ...(evidenceIds.length ? { evidenceIds } : {}) });
}

export function getBookmarkPage({ cursor, signal }: { cursor: string | null; signal?: AbortSignal }) {
  return requestJson(feedPageSchema, {
    method: 'GET',
    url: '/posts/bookmarks',
    params: { limit: 50, ...(cursor ? { cursor } : {}) },
    signal,
  });
}

export function searchPostPage({ q, cursor, signal }: { q: string; cursor: string | null; signal?: AbortSignal }) {
  return requestJson(feedPageSchema, {
    method: 'GET',
    url: '/posts/search',
    params: { q: q.slice(0, MAX_SEARCH_QUERY_LENGTH), limit: 20, ...(cursor ? { cursor } : {}) },
    signal,
  });
}
