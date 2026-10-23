import { router } from 'expo-router';
import { useState } from 'react';

import { useSessionStore } from '@/shared/stores/session-store';

import { commentFormSchema, type Comment } from '../types/posts.schema';
import { useCommentActions } from './use-posts';

/** Draft shared by the comment list (which starts an edit) and the composer pinned under it. */
export function useCommentDraft(postId: string, commentCount: number) {
  const token = useSessionStore((state) => state.accessToken);
  const actions = useCommentActions(postId, commentCount);
  const [draft, setDraft] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState('');

  function changeDraft(value: string) {
    setDraft(value);
    if (error) setError('');
  }

  function startEdit(comment: Comment) {
    setEditingId(comment.id);
    setDraft(comment.body);
    setError('');
  }

  function cancelEdit() {
    setEditingId(null);
    setDraft('');
    setError('');
  }

  async function submit() {
    if (!token) {
      router.push({ pathname: '/login', params: { returnTo: '/explore' } });
      return;
    }
    const parsed = commentFormSchema.safeParse({ body: draft });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Bình luận chưa hợp lệ.');
      return;
    }
    setError('');
    try {
      if (editingId) await actions.edit.mutateAsync({ commentId: editingId, body: parsed.data.body });
      else await actions.add.mutateAsync(parsed.data.body);
      setDraft('');
      setEditingId(null);
    } catch {
      setError('Chưa gửi được bình luận. Nội dung vẫn được giữ để bạn thử lại.');
    }
  }

  return {
    token,
    actions,
    draft,
    changeDraft,
    editingId,
    error,
    pending: actions.add.isPending || actions.edit.isPending,
    startEdit,
    cancelEdit,
    submit,
  };
}

export type CommentDraft = ReturnType<typeof useCommentDraft>;
