import { requestJson } from '@/shared/api/request-json';

import {
  bookmarkResponseSchema,
  feedPageSchema,
  likeResponseSchema,
  repostResponseSchema,
  type FeedFilter,
  type FeedSource,
} from '../types/feed.schema';

export function getFeedPage({ filter, cursor, signal, source = 'public' }: {
  filter: FeedFilter;
  cursor: string | null;
  signal?: AbortSignal;
  source?: FeedSource;
}) {
  return requestJson(feedPageSchema, {
    method: 'GET',
    url: source === 'personalized' ? '/posts/feed' : source === 'following' ? '/posts/following' : '/posts',
    params: { limit: 12, ...(cursor ? { cursor } : {}), ...(source !== 'public' || filter === 'all' ? {} : { type: filter === 'blogs' ? 'BLOG' : 'POST' }) },
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

export function setPostRepost(postId: string, reposted: boolean) {
  return requestJson(repostResponseSchema, {
    method: reposted ? 'PUT' : 'DELETE',
    url: `/posts/${postId}/repost`,
  });
}
