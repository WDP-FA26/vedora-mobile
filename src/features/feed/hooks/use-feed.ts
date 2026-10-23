import { useInfiniteQuery, useMutation, useQueryClient, type InfiniteData } from '@tanstack/react-query';

import { feedKeys } from '../data/feed.keys';
import { getFeedPage, setPostBookmark, setPostLike, setPostRepost } from '../services/feed.service';
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

function isInfinitePosts(data: unknown): data is InfiniteData<FeedPage, string | null> {
  return !!data && typeof data === 'object' && Array.isArray((data as { pages?: unknown }).pages);
}

function isPostPage(data: unknown): data is FeedPage {
  return !!data && typeof data === 'object' && Array.isArray((data as { items?: unknown }).items)
    && typeof (data as { nextCursor?: unknown }).nextCursor !== 'undefined';
}

/** Keeps every cached copy of a post (feed pages, search, bookmarks, profile, detail) in step. */
export function patchCachedPost(queryClient: ReturnType<typeof useQueryClient>, postId: string, patch: Partial<FeedPost>) {
  const patchPage = (page: FeedPage): FeedPage => ({
    ...page,
    items: page.items.map((post) => post.id === postId ? { ...post, ...patch } : post),
  });
  for (const [key, data] of queryClient.getQueriesData({})) {
    if (isInfinitePosts(data) && data.pages.every(isPostPage)) {
      queryClient.setQueryData(key, { ...data, pages: data.pages.map(patchPage) });
    } else if (isPostPage(data)) {
      queryClient.setQueryData(key, patchPage(data));
    }
  }
  queryClient.setQueryData<FeedPost>(feedKeys.detail(postId), (previous) => previous ? { ...previous, ...patch } : previous);
}

export function useFeedActions(postId: string) {
  const queryClient = useQueryClient();
  const like = useMutation({
    mutationFn: (liked: boolean) => setPostLike(postId, liked),
    onSuccess: (result) => patchCachedPost(queryClient, postId, { isLiked: result.isLiked, likeCount: result.likeCount }),
  });
  const bookmark = useMutation({
    mutationFn: (bookmarked: boolean) => setPostBookmark(postId, bookmarked),
    onSuccess: (result) => {
      patchCachedPost(queryClient, postId, { isBookmarked: result.isBookmarked });
      void queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
    },
  });
  const repost = useMutation({
    mutationFn: (reposted: boolean) => setPostRepost(postId, reposted),
    onSuccess: (result) => patchCachedPost(queryClient, postId, { isReposted: result.isReposted, repostCount: result.repostCount }),
  });
  return { like, bookmark, repost };
}
