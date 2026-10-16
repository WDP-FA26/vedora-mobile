import { useInfiniteQuery, useMutation, useQueryClient, type InfiniteData } from '@tanstack/react-query';

import { feedKeys } from '../data/feed.keys';
import { getFeedPage, setPostBookmark, setPostLike } from '../services/feed.service';
import type { FeedFilter, FeedPage, FeedPost } from '../types/feed.schema';

export function useFeed(filter: FeedFilter, enabled = true) {
  const queryClient = useQueryClient();
  const query = useInfiniteQuery({
    queryKey: feedKeys.list(filter),
    initialPageParam: null as string | null,
    queryFn: ({ pageParam, signal }) => getFeedPage({ filter, cursor: pageParam, signal }),
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled,
  });
  return {
    ...query,
    restart: () => queryClient.resetQueries({ queryKey: feedKeys.list(filter), exact: true }),
  };
}

function patchCachedPost(queryClient: ReturnType<typeof useQueryClient>, postId: string, patch: Partial<FeedPost>) {
  queryClient.setQueriesData<InfiniteData<FeedPage, string | null>>(
    { queryKey: feedKeys.all },
    (previous) => previous ? {
      ...previous,
      pages: previous.pages.map((page) => ({
        ...page,
        items: page.items.map((post) => post.id === postId ? { ...post, ...patch } : post),
      })),
    } : previous,
  );
}

export function useFeedActions(postId: string) {
  const queryClient = useQueryClient();
  const like = useMutation({
    mutationFn: (liked: boolean) => setPostLike(postId, liked),
    onSuccess: (result) => patchCachedPost(queryClient, postId, { isLiked: result.isLiked, likeCount: result.likeCount }),
  });
  const bookmark = useMutation({
    mutationFn: (bookmarked: boolean) => setPostBookmark(postId, bookmarked),
    onSuccess: (result) => patchCachedPost(queryClient, postId, { isBookmarked: result.isBookmarked }),
  });
  return { like, bookmark };
}
