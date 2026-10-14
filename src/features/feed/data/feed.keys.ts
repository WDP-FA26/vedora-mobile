import type { FeedFilter } from '../types/feed.schema';

export const feedKeys = {
  all: ['feed'] as const,
  list: (filter: FeedFilter) => [...feedKeys.all, filter] as const,
};
