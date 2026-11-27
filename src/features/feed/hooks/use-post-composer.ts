import { useQueryClient } from '@tanstack/react-query';
import { useRef, useState } from 'react';

import { createClientMessageId } from '@/features/messaging/utils/messaging';
import { postEditFormSchema } from '@/features/posts/types/post-edit.schema';
import { ApiError } from '@/shared/api/api-error';
import { getSessionRevision } from '@/shared/session/session-manager';
import { feedKeys } from '../data/feed.keys';
import * as api from '../services/compose.service';
import type { PostDraft } from '../types/compose.schema';
import { useVideoFiles } from './use-video-files';

export function usePostComposer(initial: PostDraft | null) {
  const client = useQueryClient();
  const files = useVideoFiles();
  const [body, setBody] = useState(initial?.body ?? '');
  const [kept, setKept] = useState(initial?.media ?? []);
  const draft = useRef(initial);
  const draftId = useRef(initial?.id ?? createClientMessageId());
  const revision = useRef(getSessionRevision());
  const running = useRef(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const signature = JSON.stringify([body, kept.map((item) => item.id), files.entries.map((item) => item.id)]);
  const [saved, setSaved] = useState(signature);
  const assertSession = () => { if (revision.current !== getSessionRevision()) throw new Error('Phiên đăng nhập đã đổi. Hãy mở lại bản nháp.'); };

  async function persist(publish: boolean) {
    if (running.current || files.picking) return;
    const parsed = postEditFormSchema.safeParse({ body, mediaIds: [...kept.map((item) => item.id), ...files.entries.map((item) => item.id)] });
    if (publish && !parsed.success) { setError(parsed.error.issues[0]?.message ?? 'Kiểm tra lại nội dung.'); return; }
    if (!body.trim() && !kept.length && !files.entries.length) { setError('Hãy viết nội dung hoặc thêm video.'); return; }
    running.current = true; setBusy(true); setError(''); setNotice('');
    try {
      assertSession();
      if (!draft.current) draft.current = await api.createDraft(draftId.current, 'POST');
      assertSession();
      draft.current = await api.saveDraft(draftId.current, { expectedVersion: draft.current.version, body, title: '', description: '' });
      assertSession();
      const keepIds = new Set([...kept.map((item) => item.id), ...files.entries.map((item) => item.mediaId ?? item.id)]);
      for (const item of draft.current.media) {
        if (!keepIds.has(item.id)) {
          assertSession();
          draft.current = await api.removeDraftMedia(draftId.current, item.id, draft.current.version);
        }
      }
      await files.uploadAll(async (entry) => {
        assertSession();
        let mediaId = entry.mediaId ?? entry.id;
        const old = draft.current?.media.find((item) => item.id === mediaId);
        if (old?.status === 'FAILED') {
          draft.current = await api.removeDraftMedia(draftId.current, old.id, draft.current!.version);
          mediaId = createClientMessageId();
        }
        const target = await api.requestDraftUpload(draftId.current, mediaId);
        assertSession();
        draft.current = target.draft;
        return { id: mediaId, upload: target.upload };
      });
      assertSession();
      draft.current = await api.getDraft(draftId.current);
      assertSession();
      if (publish) {
        for (let attempt = 0; draft.current.media.some((item) => item.status === 'WAITING_UPLOAD') && attempt < 10; attempt++) {
          await new Promise((resolve) => setTimeout(resolve, 1500));
          assertSession();
          draft.current = await api.getDraft(draftId.current);
        }
        assertSession();
        if (draft.current.media.some((item) => item.status === 'WAITING_UPLOAD' || item.status === 'FAILED')) throw new Error('Video chưa sẵn sàng. Bản nháp đã lưu; hãy mở lại để kiểm tra hoặc gỡ video lỗi.');
        const result = await api.publishDraft(draftId.current, draft.current.version);
        assertSession();
        files.commit(draft.current.media.map((item) => item.id));
        setSaved(signature);
        void client.invalidateQueries({ queryKey: feedKeys.all });
        void client.invalidateQueries({ queryKey: ['profile'] });
        void client.invalidateQueries({ queryKey: feedKeys.drafts });
        return result;
      }
      setSaved(signature); setNotice('Đã lưu bản nháp. Bạn có thể tiếp tục trên mobile hoặc web.');
      void client.invalidateQueries({ queryKey: feedKeys.drafts });
    } catch (caught) {
      setError(caught instanceof ApiError && caught.status === 409 ? 'Bản nháp vừa thay đổi ở nơi khác. Nội dung trên màn hình được giữ; hãy sao chép nội dung trước khi mở lại bản nháp.' : caught instanceof Error ? caught.message : 'Chưa lưu được. Hãy thử lại.');
    } finally { running.current = false; setBusy(false); }
  }
  return { body, setBody, kept, removeMedia: (id: string) => setKept((items) => items.filter((item) => item.id !== id)), files, busy, dirty: signature !== saved, error, setError, notice, persist };
}
