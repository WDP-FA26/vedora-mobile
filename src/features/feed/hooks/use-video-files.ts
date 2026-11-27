import * as ImagePicker from 'expo-image-picker';
import { File } from 'expo-file-system';
import { useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';

import { createClientMessageId } from '@/features/messaging/utils/messaging';
import { getSessionRevision } from '@/shared/session/session-manager';
import { ApiError } from '@/shared/api/api-error';
import { uploadVideoToCloudinary } from '../services/compose.service';
import { MAX_VIDEO_DURATION_SECONDS, type SelectedComposeVideo, type VideoUploadTarget } from '../types/compose.schema';

export type VideoFile = { id: string; video: SelectedComposeVideo; mediaId: string | null; uploaded: boolean; progress: number | null; error: string | null };
type UploadTarget = { id: string; upload: VideoUploadTarget['upload'] | null };

/** Owns local files and cancellable uploads. Draft attachments stay on the server; unattached edit uploads are discarded. */
export function useVideoFiles(discardUpload?: (id: string) => Promise<unknown>) {
  const [entries, setEntries] = useState<VideoFile[]>([]);
  const [picking, setPicking] = useState(false);
  const pickingRef = useRef(false);
  const files = useRef<VideoFile[]>([]);
  const alive = useRef(true);
  const revision = useRef(getSessionRevision());
  const controller = useRef<AbortController | null>(null);
  const uploads = useRef(new Set<string>());
  const committed = useRef(new Set<string>());
  const discard = useRef(discardUpload);
  useEffect(() => { discard.current = discardUpload; }, [discardUpload]);
  const release = (video: SelectedComposeVideo) => { if (Platform.OS === 'web' && video.uri.startsWith('blob:')) URL.revokeObjectURL(video.uri); };
  function update(next: VideoFile[]) { files.current = next; if (alive.current) setEntries(next); }
  function check() {
    if (!alive.current || revision.current !== getSessionRevision()) throw new Error('Phiên làm việc đã kết thúc. Hãy mở lại trình soạn bài.');
    if (controller.current?.signal.aborted) throw new Error('Đã dừng tải video. Bạn có thể thử lại.');
  }
  useEffect(() => {
    alive.current = true;
    const startedRevision = revision.current;
    const pendingUploads = uploads.current;
    const attached = committed.current;
    return () => {
      alive.current = false;
      controller.current?.abort();
      for (const entry of files.current) release(entry.video);
      if (startedRevision === getSessionRevision()) for (const id of pendingUploads) if (!attached.has(id)) void discard.current?.(id).catch(() => {});
    };
  }, []);

  async function pick(remaining: number, maxBytes?: number, maxDuration = MAX_VIDEO_DURATION_SECONDS) {
    if (pickingRef.current || controller.current || remaining <= 0) return;
    pickingRef.current = true;
    setPicking(true);
    let picked: SelectedComposeVideo[] = [];
    try {
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['videos'], allowsEditing: false, allowsMultipleSelection: true, selectionLimit: remaining });
      if (result.canceled) return;
      picked = result.assets.map((asset) => ({ uri: asset.uri, fileName: asset.fileName ?? asset.file?.name ?? 'Video', file: asset.file, mimeType: asset.mimeType ?? asset.file?.type, sizeBytes: asset.fileSize ?? asset.file?.size ?? (maxBytes && Platform.OS !== 'web' ? new File(asset.uri).size : undefined), durationSeconds: typeof asset.duration === 'number' ? (Platform.OS === 'web' ? asset.duration : asset.duration / 1000) : undefined }));
      check();
      if (result.assets.some((asset) => asset.type && asset.type !== 'video')) throw new Error('Vui lòng chọn tệp video.');
      if (picked.length > remaining) throw new Error(`Bạn chỉ có thể thêm ${remaining} video nữa.`);
      if (picked.some((video) => (video.durationSeconds ?? 0) > maxDuration)) throw new Error('Mỗi video tối đa 3 phút.');
      if (maxBytes && picked.some((video) => !video.sizeBytes || video.sizeBytes > maxBytes)) throw new Error(`Video tối đa ${Math.round(maxBytes / 1048576)} MB.`);
      update([...files.current, ...picked.map((video) => ({ id: createClientMessageId(), video, mediaId: null, uploaded: false, progress: null, error: null }))]);
      picked = [];
    } finally { picked.forEach(release); pickingRef.current = false; if (alive.current) setPicking(false); }
  }

  function remove(id: string) {
    const entry = files.current.find((item) => item.id === id);
    if (!entry || controller.current) return;
    release(entry.video);
    if (entry.mediaId && revision.current === getSessionRevision() && !committed.current.has(entry.mediaId)) void discard.current?.(entry.mediaId).catch(() => {});
    update(files.current.filter((item) => item.id !== id));
  }

  async function uploadAll(prepare: (entry: VideoFile) => Promise<UploadTarget>) {
    if (controller.current) throw new Error('Video đang được tải lên.');
    controller.current = new AbortController();
    const patch = (id: string, values: Partial<VideoFile>) => update(files.current.map((entry) => entry.id === id ? { ...entry, ...values } : entry));
    const ids: string[] = [];
    try {
      check();
      for (const entry of [...files.current]) {
        if (entry.uploaded && entry.mediaId) { ids.push(entry.mediaId); continue; }
        try {
          patch(entry.id, { progress: 0, error: null });
          if (entry.mediaId && discard.current) {
            try { await discard.current(entry.mediaId); }
            catch (error) { if (!(error instanceof ApiError) || error.status !== 404) throw error; }
            uploads.current.delete(entry.mediaId);
            check();
          }
          const target = await prepare(entry);
          uploads.current.add(target.id);
          if (!alive.current && revision.current === getSessionRevision()) void discard.current?.(target.id).catch(() => {});
          check();
          patch(entry.id, { mediaId: target.id });
          if (target.upload) await uploadVideoToCloudinary(entry.video, target.upload, (progress) => { if (alive.current) patch(entry.id, { progress }); }, controller.current.signal);
          check();
          patch(entry.id, { uploaded: true, progress: 100 });
          ids.push(target.id);
        } catch (error) {
          patch(entry.id, { error: error instanceof Error ? error.message : 'Chưa tải được video.', progress: null });
          throw error;
        }
      }
      return ids;
    } finally { controller.current = null; }
  }
  return { entries, picking, pick, remove, clear: () => [...files.current].forEach((entry) => remove(entry.id)), uploadAll, commit: (ids: string[]) => ids.forEach((id) => committed.current.add(id)), cancel: () => controller.current?.abort() };
}
