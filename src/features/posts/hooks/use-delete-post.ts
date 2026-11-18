import { useMutation, useQueryClient } from '@tanstack/react-query';

import { blogsKeys } from '@/features/blogs/data/blogs.keys';
import { feedKeys } from '@/features/feed/data/feed.keys';
import type { FeedPost } from '@/features/feed/types/feed.schema';
import { notificationKeys } from '@/features/notifications/data/notification.keys';
import { profileKeys } from '@/features/profile/data/profile.keys';

import { postsKeys } from '../data/posts.keys';
import { deletePost } from '../services/posts.service';

export function useDeletePost(postId: string, type: FeedPost['type']) {
  const client = useQueryClient();
  return useMutation({
    networkMode: 'always',
    retry: false,
    mutationFn: () => deletePost(postId, type),
    onSuccess: async () => {
      const lists = [feedKeys.all, blogsKeys.mine, postsKeys.bookmarks, ['post-search'], ['profile', 'posts'], ['following', 'author-posts']];
      const details = [feedKeys.detail(postId), blogsKeys.detail(postId)];
      // Stop stale reads and discard cursors that may point to the deleted item.
      await Promise.all([...lists, ...details].map((queryKey) => client.cancelQueries({ queryKey })));
      for (const queryKey of details) client.removeQueries({ queryKey });
      for (const queryKey of lists) void client.resetQueries({ queryKey });
      void client.invalidateQueries({ queryKey: profileKeys.all });
      void client.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}
