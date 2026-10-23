import type { FeedFilter } from '../types/feed.schema';

export const feedKeys = {
  all: ['feed'] as const,
  list: (filter: FeedFilter) => [...feedKeys.all, filter] as const,
  /** A single post; lives outside `all` because its cache entry is a post, not a page. */
  detail: (postId: string) => ['post', postId] as const,
};
