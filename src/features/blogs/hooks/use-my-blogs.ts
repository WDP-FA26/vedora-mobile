import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { feedKeys } from '@/features/feed/data/feed.keys';
import { postsKeys } from '@/features/posts/data/posts.keys';
import { profileKeys } from '@/features/profile/data/profile.keys';
import { useSessionStore } from '@/shared/stores/session-store';

import { blogsKeys } from '../data/blogs.keys';
import { getMyBlogs, saveBlog } from '../services/blogs.service';
import type { BlogInput } from '../types/blogs.schema';

export function useMyBlogs() {
  const token = useSessionStore((state) => state.accessToken);
  return useInfiniteQuery({
    queryKey: blogsKeys.mine,
    enabled: !!token,
    initialPageParam: null as string | null,
    queryFn: ({ pageParam, signal }) => getMyBlogs(pageParam, signal),
    getNextPageParam: (page) => page.nextCursor ?? undefined,
  });
}

export function useSaveBlog() {
  const client = useQueryClient();
  return useMutation({
    // Fail offline requests instead of leaving the editor locked on a paused mutation.
    networkMode: 'always',
    mutationFn: ({ id, input }: { id: string | null; input: BlogInput }) => saveBlog(id, input),
    onSuccess: (blog) => {
      client.setQueryData(blogsKeys.detail(blog.id), blog);
      for (const queryKey of [blogsKeys.mine, feedKeys.all, feedKeys.detail(blog.id), profileKeys.all, postsKeys.bookmarks, ['post-search'], ['following']]) {
        void client.invalidateQueries({ queryKey });
      }
    },
  });
}
