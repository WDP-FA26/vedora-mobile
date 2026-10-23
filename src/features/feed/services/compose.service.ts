import { File } from 'expo-file-system';
import { Platform } from 'react-native';

import { apiClient } from '@/shared/api/api-client';
import { requestJson } from '@/shared/api/request-json';

import {
  createPostInputSchema,
  createdPostSchema,
  videoUploadTargetSchema,
  type SelectedComposeVideo,
  type VideoUploadTarget,
} from '../types/compose.schema';

export function requestVideoUpload() {
  return requestJson(videoUploadTargetSchema, {
    method: 'POST',
    url: '/media/uploads',
    data: { type: 'VIDEO' },
  });
}

export async function discardVideoUpload(mediaId: string) {
  await apiClient.request({ method: 'DELETE', url: `/media/${encodeURIComponent(mediaId)}` });
}

export function createPost(body: string, mediaIds?: string[]) {
  const input = createPostInputSchema.parse({
    type: 'POST',
    body,
    ...(mediaIds ? { mediaIds } : {}),
  });
  return requestJson(createdPostSchema, {
    method: 'POST',
    url: '/posts',
    data: input,
  });
}


/**
 * Sends the video straight to Cloudinary with the API's signed fields, never through the Vedora
 * API client. Files above `chunkSize` go in chunks sharing an `X-Unique-Upload-Id`.
 * XHR rather than fetch, for upload progress.
 */
export async function uploadVideoToCloudinary(
  video: SelectedComposeVideo,
  { url, fields, chunkSize }: VideoUploadTarget['upload'],
  onProgress: (percentage: number | null) => void,
  signal?: AbortSignal,
) {
  let blob: Blob;
  if (Platform.OS === 'web') {
    if (!video.file) throw new Error('Không đọc được video đã chọn. Vui lòng chọn lại.');
    blob = video.file;
  } else {
    const file = new File(video.uri);
    if (!file.exists || file.size === 0) {
      throw new Error('Không đọc được video đã chọn. Vui lòng chọn lại.');
    }
    blob = file;
  }
  const total = blob.size;
  const name = video.fileName || 'video';
  const uploadId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  onProgress(0);

  for (let start = 0; start < total; start += chunkSize) {
    const end = Math.min(start + chunkSize, total);
    const body = new FormData();
    for (const [key, value] of Object.entries(fields)) body.append(key, value);
    body.append('file', blob.slice(start, end, video.mimeType || 'video/mp4'), name);
    await sendChunk({ url, body, chunked: total > chunkSize, uploadId, start, end, total, onProgress, signal });
  }
  onProgress(100);
}

type ChunkRequest = {
  url: string;
  body: FormData;
  chunked: boolean;
  uploadId: string;
  start: number;
  end: number;
  total: number;
  onProgress: (percentage: number | null) => void;
  signal?: AbortSignal;
};

function sendChunk({ url, body, chunked, uploadId, start, end, total, onProgress, signal }: ChunkRequest) {
  return new Promise<void>((resolve, reject) => {
    if (signal?.aborted) return reject(new Error('Đã hủy tải video.'));
    const xhr = new XMLHttpRequest();
    xhr.open('POST', url);
    if (chunked) {
      xhr.setRequestHeader('X-Unique-Upload-Id', uploadId);
      xhr.setRequestHeader('Content-Range', `bytes ${start}-${end - 1}/${total}`);
    }
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && event.total > 0) {
        const sent = start + (event.loaded / event.total) * (end - start);
        onProgress(Math.min(99, Math.round((sent / total) * 100)));
      }
    };
    xhr.onerror = () => reject(new Error('Tải video lên thất bại. Kiểm tra kết nối và thử lại.'));
    xhr.onabort = () => reject(new Error('Đã hủy tải video.'));
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) return resolve();
      let message = `Tải video lên thất bại (HTTP ${xhr.status}).`;
      try {
        const parsed = JSON.parse(xhr.responseText) as { error?: { message?: string } };
        if (parsed.error?.message) message = parsed.error.message;
      } catch {
        // Not JSON; keep the status message.
      }
      reject(new Error(message));
    };
    signal?.addEventListener('abort', () => xhr.abort(), { once: true });
    xhr.send(body);
  });
}
