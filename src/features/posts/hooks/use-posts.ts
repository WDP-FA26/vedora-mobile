import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { feedKeys } from '@/features/feed/data/feed.keys';
import { patchCachedPost } from '@/features/feed/hooks/use-feed';

import { postsKeys } from '../data/posts.keys';
import { createComment, deleteComment, getCommentPage, getPost, reportPost, updateComment } from '../services/posts.service';
import type { ReportInput } from '../types/posts.schema';

export function usePost(postId: string) {
  return useQuery({
    queryKey: feedKeys.detail(postId),
    queryFn: ({ signal }) => getPost(postId, signal),
  });
}

export function useComments(postId: string) {
  return useInfiniteQuery({
    queryKey: postsKeys.comments(postId),
    initialPageParam: null as string | null,
    queryFn: ({ pageParam, signal }) => getCommentPage({ postId, cursor: pageParam, signal }),
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });
}

/** Writes refetch the comment list (cursors stay valid) and update the count shown on cards. */
export function useCommentActions(postId: string, commentCount: number) {
  const queryClient = useQueryClient();
  const refresh = (nextCount?: number) => {
    void queryClient.invalidateQueries({ queryKey: postsKeys.comments(postId) });
    if (nextCount !== undefined) patchCachedPost(queryClient, postId, { commentCount: Math.max(0, nextCount) });
  };
  const add = useMutation({
    mutationFn: (body: string) => createComment(postId, body),
    onSuccess: () => refresh(commentCount + 1),
  });
  const edit = useMutation({
    mutationFn: ({ commentId, body }: { commentId: string; body: string }) => updateComment(postId, commentId, body),
    onSuccess: () => refresh(),
  });
  const remove = useMutation({
    mutationFn: (commentId: string) => deleteComment(postId, commentId),
    onSuccess: () => refresh(commentCount - 1),
  });
  return { add, edit, remove };
}

export function useReportPost(postId: string) {
  return useMutation({ mutationFn: (input: ReportInput) => reportPost(postId, input) });
}
