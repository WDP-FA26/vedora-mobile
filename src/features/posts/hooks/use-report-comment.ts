import { useMutation } from '@tanstack/react-query';

import { ApiError } from '@/shared/api/api-error';
import { useSessionStore } from '@/shared/stores/session-store';

import { reportComment } from '../services/comment-report.service';
import type { CommentReportInput } from '../types/posts.schema';

export function useReportComment(postId: string, commentId: string) {
  const token = useSessionStore((state) => state.accessToken);
  return useMutation({ networkMode: 'always', retry: false, mutationFn: async (input: CommentReportInput) => {
    const assertSession = () => {
      if (!token || useSessionStore.getState().accessToken !== token) throw new ApiError(401, 'SESSION_CHANGED', 'Session changed');
    };
    assertSession();
    const result = await reportComment(postId, commentId, input);
    assertSession();
    return result;
  } });
}
