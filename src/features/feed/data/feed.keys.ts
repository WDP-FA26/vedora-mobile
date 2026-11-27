import type { FeedFilter, FeedSource } from '../types/feed.schema';

export const feedKeys = {
  all: ['feed'] as const,
  list: (filter: FeedFilter, source: FeedSource = 'public') => [...feedKeys.all, filter, source] as const,
  /** A single post; lives outside `all` because its cache entry is a post, not a page. */
  detail: (postId: string) => ['post', postId] as const,
  /** Your private POST and VIDEO drafts (`/posts/drafts`). */
  drafts: ['post-drafts'] as const,
};
