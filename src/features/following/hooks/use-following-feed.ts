import { useInfiniteQuery, useQueries, useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

import type { FeedPost } from "@/features/feed/types/feed.schema";
import { useSessionStore } from "@/shared/stores/session-store";

import {
  getAuthorRecentPosts,
  getFollowedAuthorsPage,
  getMyProfile,
  type FollowedAuthor,
} from "../services/following.service";

/** Build the timeline from the existing profile-list and author-post endpoints. */
export function useFollowingFeed() {
  const accessToken = useSessionStore((state) => state.accessToken);
  const me = useQuery({
    queryKey: ["following", "me"],
    queryFn: ({ signal }) => getMyProfile(signal),
    enabled: Boolean(accessToken),
  });
  const profileId = me.data?.id;
  const following = useInfiniteQuery({
    queryKey: ["following", "authors", profileId],
    initialPageParam: null as string | null,
    queryFn: ({ pageParam, signal }) =>
      getFollowedAuthorsPage({ profileId: profileId!, cursor: pageParam, signal }),
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled: Boolean(accessToken && profileId),
  });
  const authors = useMemo(() => {
    const byId = new Map<string, FollowedAuthor>();
    if (!accessToken) return [];
    for (const page of following.data?.pages ?? []) {
      for (const author of page.items) byId.set(author.id, author);
    }
    return [...byId.values()];
  }, [accessToken, following.data]);
  const authorPosts = useQueries({
    queries: authors.map((author) => ({
      queryKey: ["following", "author-posts", author.id],
      queryFn: ({ signal }: { signal: AbortSignal }) => getAuthorRecentPosts(author.id, signal),
      enabled: Boolean(accessToken),
      staleTime: 60_000,
    })),
  });
  const posts = useMemo(() => {
    const byId = new Map<string, FeedPost>();
    for (const result of authorPosts) {
      for (const post of result.data?.items ?? []) {
        if (post.status === "PUBLISHED") byId.set(post.id, post);
      }
    }
    return [...byId.values()].sort((a, b) =>
      (b.publishedAt ?? b.createdAt).localeCompare(a.publishedAt ?? a.createdAt),
    );
  }, [authorPosts]);

  return {
    accessToken,
    authors,
    posts,
    loading: Boolean(accessToken) && (
      me.isPending ||
      (Boolean(profileId) && following.isPending) ||
      authorPosts.some((query) => query.isPending)
    ),
    refreshing: me.isRefetching || following.isRefetching || authorPosts.some((query) => query.isRefetching),
    error: me.isError || following.isError || authorPosts.some((query) => query.isError),
    hasMoreAuthors: Boolean(following.hasNextPage),
    loadingMoreAuthors: following.isFetchingNextPage,
    loadMoreAuthors: () => following.fetchNextPage(),
    retry: () => {
      if (me.isError) void me.refetch();
      if (following.isError) void following.refetch();
      for (const query of authorPosts) if (query.isError) void query.refetch();
    },
    refresh: () => {
      void me.refetch();
      void following.refetch();
      for (const query of authorPosts) void query.refetch();
    },
  };
}
