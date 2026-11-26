import { useMutation, useQueryClient } from '@tanstack/react-query';

import { feedKeys } from '@/features/feed/data/feed.keys';
import { messagingKeys } from '@/features/messaging/data/messaging.keys';
import { profileKeys } from '@/features/profile/data/profile.keys';
import { ApiError } from '@/shared/api/api-error';
import { useSessionStore } from '@/shared/stores/session-store';

import { postsKeys } from '../data/posts.keys';
import { updatePost } from '../services/posts.service';
import type { PostUpdate } from '../types/post-edit.schema';

export function useUpdatePost(postId: string) {
  const client = useQueryClient();
  const token = useSessionStore((state) => state.accessToken);
  const assertSession = () => {
    if (!token || useSessionStore.getState().accessToken !== token) throw new ApiError(401, 'SESSION_CHANGED', 'Session changed');
  };
  return useMutation({
    networkMode: 'always', retry: false,
    mutationFn: async (input: PostUpdate) => {
      assertSession();
      const post = await updatePost(postId, input);
      assertSession();
      if (post.id !== postId || post.type !== 'POST') throw new Error('Updated post response mismatch');
      return post;
    },
    onSuccess: async (post) => {
      const lists = [feedKeys.all, postsKeys.bookmarks, ['post-search'], ['profile', 'posts'], profileKeys.repostsAll, ['following', 'author-posts']];
      await Promise.all([
        client.cancelQueries({ queryKey: feedKeys.detail(postId), exact: true }),
        ...lists.map((queryKey) => client.cancelQueries({ queryKey })),
      ]);
      assertSession();
      client.setQueryData(feedKeys.detail(postId), post);
      // Editing sends the post back to moderation; discard public lists and their cursors.
      for (const queryKey of lists) void client.resetQueries({ queryKey });
      void client.invalidateQueries({ queryKey: profileKeys.all });
      void client.invalidateQueries({ queryKey: messagingKeys.all });
    },
  });
}
