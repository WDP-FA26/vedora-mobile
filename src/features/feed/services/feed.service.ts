import { requestJson } from '@/shared/api/request-json';

import { bookmarkResponseSchema, feedPageSchema, likeResponseSchema, type FeedFilter } from '../types/feed.schema';

export function getFeedPage({ filter, cursor, signal }: {
  filter: FeedFilter;
  cursor: string | null;
  signal?: AbortSignal;
}) {
  return requestJson(feedPageSchema, {
    method: 'GET',
    url: '/posts',
    params: { limit: 12, ...(cursor ? { cursor } : {}), ...(filter === 'all' ? {} : { type: filter === 'blogs' ? 'BLOG' : 'POST' }) },
    signal,
  });
}

export function setPostLike(postId: string, liked: boolean) {
  return requestJson(likeResponseSchema, {
    method: liked ? 'PUT' : 'DELETE',
    url: `/posts/${postId}/like`,
  });
}

export function setPostBookmark(postId: string, bookmarked: boolean) {
  return requestJson(bookmarkResponseSchema, {
    method: bookmarked ? 'PUT' : 'DELETE',
    url: `/posts/${postId}/bookmark`,
  });
}
