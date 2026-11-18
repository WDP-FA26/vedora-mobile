import { router } from 'expo-router';
import { useRef, useState, type ComponentRef } from 'react';
import type { TextInput } from 'react-native';

import { ApiError } from '@/shared/api/api-error';
import { useSessionStore } from '@/shared/stores/session-store';

import { commentFormSchema, type Comment } from '../types/posts.schema';
import { useCommentActions } from './use-posts';

/** Shown when moderation turns a comment away; the composer adds a link to the guidelines after it. */
export const COMMENT_REJECTED_MESSAGE = 'Bình luận của bạn không được đăng vì vi phạm Tiêu chuẩn cộng đồng. Hãy sửa lại nội dung rồi gửi lại.';

/** Draft shared by the comment list (which starts an edit) and the composer pinned under it. */
export function useCommentDraft(postId: string) {
  const token = useSessionStore((state) => state.accessToken);
  const actions = useCommentActions(postId);
  const [draft, setDraft] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingRootId, setEditingRootId] = useState<string | null>(null);
  const submitting = useRef(false);
  const inputRef = useRef<ComponentRef<typeof TextInput>>(null);
  const [replyingTo, setReplyingTo] = useState<Comment | null>(null);
  const [error, setError] = useState('');

  function changeDraft(value: string) {
    if (submitting.current) return;
    setDraft(value);
    if (error) setError('');
  }

  function startEdit(comment: Comment) {
    if (submitting.current) return;
    setReplyingTo(null);
    setEditingId(comment.id);
    setEditingRootId(comment.parentId ?? comment.id);
    inputRef.current?.focus();
    setDraft(comment.body);
    setError('');
  }

  function startReply(comment: Comment) {
    if (submitting.current) return;
    if (editingId) setDraft('');
    setEditingId(null);
    setEditingRootId(null);
    setReplyingTo(comment);
    inputRef.current?.focus();
    setError('');
  }

  function cancelEdit() {
    if (submitting.current) return;
    setReplyingTo(null);
    setEditingId(null);
    setEditingRootId(null);
    setDraft('');
    setError('');
  }

  async function submit() {
    if (submitting.current) return;
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
    submitting.current = true;
    try {
      if (editingId) await actions.edit.mutateAsync({ commentId: editingId, body: parsed.data.body });
      else if (replyingTo) await actions.reply.mutateAsync({ targetId: replyingTo.id, body: parsed.data.body });
      else await actions.add.mutateAsync(parsed.data.body);
      setDraft('');
      setEditingId(null);
      setEditingRootId(null);
      setReplyingTo(null);
    } catch (caught) {
      setError(caught instanceof ApiError && caught.code === 'CONTENT_REJECTED'
        ? COMMENT_REJECTED_MESSAGE
        : caught instanceof ApiError && caught.status === 404
          ? 'Bình luận hoặc bài viết không còn tồn tại. Hãy hủy thao tác và tải lại danh sách. Nội dung vẫn được giữ trong ô nhập.'
          : 'Chưa xác nhận gửi được bình luận. Nội dung vẫn được giữ. Hãy kiểm tra danh sách trước khi thử gửi lại.');
      void actions.reload();
    } finally {
      submitting.current = false;
    }
  }

  return {
    token,
    inputRef,
    actions,
    draft,
    changeDraft,
    editingId,
    editingRootId,
    replyingTo,
    startReply,
    error,
    pending: actions.add.isPending || actions.edit.isPending || actions.reply.isPending,
    startEdit,
    cancelEdit,
    submit,
  };
}

export type CommentDraft = ReturnType<typeof useCommentDraft>;
