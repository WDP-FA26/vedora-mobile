import { useMemo } from 'react';

import { useFeed } from '@/features/feed/hooks/use-feed';
import { useSessionStore } from '@/shared/stores/session-store';

export function useFollowingFeed() {
  const accessToken = useSessionStore((state) => state.accessToken);
  const feed = useFeed('all', Boolean(accessToken), 'following');
  const posts = useMemo(() => {
    const seen = new Set<string>();
    return (accessToken ? feed.data?.pages.flatMap((page) => page.items) ?? [] : [])
      .filter((post) => {
        if (post.status !== 'PUBLISHED' || seen.has(post.id)) return false;
        seen.add(post.id);
        return true;
      });
  }, [accessToken, feed.data]);
  const authors = [...new Map(posts.map((post) => [post.author.id, post.author])).values()];
  return {
    accessToken, authors, posts,
    loading: Boolean(accessToken) && feed.isPending,
    error: feed.isError,
    hasMorePosts: Boolean(feed.hasNextPage),
    loadingMorePosts: feed.isFetchingNextPage,
    loadMorePosts: () => feed.fetchNextPage(),
    retry: feed.restart,
    refresh: feed.restart,
  };
}
