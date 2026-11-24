import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { feedKeys } from '@/features/feed/data/feed.keys';
import { patchCachedPost } from '@/features/feed/hooks/use-feed';

import { useSessionStore } from '@/shared/stores/session-store';
import { ApiError } from '@/shared/api/api-error';

import { postsKeys } from '../data/posts.keys';
import { createComment, createReply, deleteComment, getBookmarkPage, getComment, getCommentPage, getPost, getReplyPage, reportPost, searchPostPage, updateComment } from '../services/posts.service';
import type { ReportInput } from '../types/posts.schema';
import { isPostProcessing } from '../utils/post-status';

export function usePost(postId: string) {
  return useQuery({
    queryKey: feedKeys.detail(postId),
    queryFn: ({ signal }) => getPost(postId, signal),
    refetchInterval: (query) => query.state.data && isPostProcessing(query.state.data.status) ? 5000 : false,
  });
}

export function useComments(postId: string) {
  const queryClient = useQueryClient();
  const query = useInfiniteQuery({
    queryKey: postsKeys.comments(postId),
    initialPageParam: null as string | null,
    queryFn: ({ pageParam, signal }) => getCommentPage({ postId, cursor: pageParam, signal }),
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });
  return { ...query, restart: () => queryClient.resetQueries({ queryKey: postsKeys.comments(postId), exact: true }) };
}

export function useComment(postId: string, commentId?: string) {
  return useQuery({
    queryKey: postsKeys.comment(postId, commentId ?? ''),
    queryFn: ({ signal }) => getComment(postId, commentId!, signal),
    enabled: !!commentId,
    retry: false,
  });
}

export function useReplies(postId: string, rootId: string, enabled: boolean) {
  const queryClient = useQueryClient();
  const query = useInfiniteQuery({
    queryKey: postsKeys.replies(postId, rootId),
    initialPageParam: null as string | null,
    queryFn: ({ pageParam, signal }) => getReplyPage({ postId, rootId, cursor: pageParam, signal }),
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled,
  });
  return { ...query, restart: () => queryClient.resetQueries({ queryKey: postsKeys.replies(postId, rootId), exact: true }) };
}

/** Deleted comments can invalidate cursors; totals include every descendant. */
export function useCommentActions(postId: string) {
  const queryClient = useQueryClient();
  const refresh = (reset = false) => {
    const filter = { queryKey: postsKeys.comments(postId) };
    if (reset) void queryClient.resetQueries(filter);
    else void queryClient.invalidateQueries(filter);
    void getPost(postId).then((post) => {
      patchCachedPost(queryClient, postId, { commentCount: post.commentCount });
    }).catch(() => queryClient.invalidateQueries({ queryKey: feedKeys.detail(postId), exact: true }));
  };
  const add = useMutation({ mutationFn: (body: string) => createComment(postId, body), onSuccess: () => refresh() });
  const reply = useMutation({
    mutationFn: ({ targetId, body }: { targetId: string; body: string }) => createReply(postId, targetId, body),
    onSuccess: () => refresh(),
  });
  const edit = useMutation({
    mutationFn: ({ commentId, body }: { commentId: string; body: string }) => updateComment(postId, commentId, body),
    onSuccess: () => refresh(),
  });
  const remove = useMutation({ mutationFn: (commentId: string) => deleteComment(postId, commentId), onSuccess: () => refresh(true) });
  return { add, reply, edit, remove, reload: () => refresh(true) };
}

export function useReportPost(postId: string) {
  const token = useSessionStore((state) => state.accessToken);
  return useMutation({ networkMode: 'always', retry: false, mutationFn: async (input: ReportInput) => {
    if (!token || useSessionStore.getState().accessToken !== token) throw new ApiError(401, 'SESSION_CHANGED', 'Session changed');
    await reportPost(postId, input);
    if (useSessionStore.getState().accessToken !== token) throw new ApiError(401, 'SESSION_CHANGED', 'Session changed');
  } });
}

export function useBookmarks() {
  const token = useSessionStore((state) => state.accessToken);
  return useInfiniteQuery({
    queryKey: postsKeys.bookmarks,
    initialPageParam: null as string | null,
    queryFn: ({ pageParam, signal }) => getBookmarkPage({ cursor: pageParam, signal }),
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled: !!token,
  });
}

export function usePostSearch(q: string) {
  return useInfiniteQuery({
    queryKey: postsKeys.search(q),
    initialPageParam: null as string | null,
    queryFn: ({ pageParam, signal }) => searchPostPage({ q, cursor: pageParam, signal }),
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled: q.length > 0,
  });
}
