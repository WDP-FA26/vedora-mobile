import { File, FileMode, Paths, UploadType } from 'expo-file-system';
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
 */
export async function uploadVideoToCloudinary(
  video: SelectedComposeVideo,
  target: VideoUploadTarget['upload'],
  onProgress: (percentage: number | null) => void,
  signal?: AbortSignal,
) {
  const uploadId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  onProgress(0);
  if (Platform.OS === 'web') await uploadFromBrowser(video, target, uploadId, onProgress, signal);
  else await uploadFromDevice(video, target, uploadId, onProgress, signal);
  onProgress(100);
}

function chunkHeaders(chunked: boolean, uploadId: string, start: number, end: number, total: number): Record<string, string> {
  return chunked
    ? { 'X-Unique-Upload-Id': uploadId, 'Content-Range': `bytes ${start}-${end - 1}/${total}` }
    : {};
}

function uploadFailure(status: number, body: string) {
  let message = `Tải video lên thất bại (HTTP ${status}).`;
  try {
    const parsed = JSON.parse(body) as { error?: { message?: string } };
    if (parsed.error?.message) message = parsed.error.message;
  } catch {
    // Not JSON; keep the status message.
  }
  return new Error(message);
}

/** Browser: slice the picked `File` into multipart `FormData`; XHR rather than fetch, for progress. */
async function uploadFromBrowser(
  video: SelectedComposeVideo,
  { url, fields, chunkSize }: VideoUploadTarget['upload'],
  uploadId: string,
  onProgress: (percentage: number | null) => void,
  signal?: AbortSignal,
) {
  const file = video.file;
  if (!file) throw new Error('Không đọc được video đã chọn. Vui lòng chọn lại.');
  const total = file.size;
  const name = video.fileName || 'video';

  for (let start = 0; start < total; start += chunkSize) {
    const end = Math.min(start + chunkSize, total);
    const body = new FormData();
    for (const [key, value] of Object.entries(fields)) body.append(key, value);
    body.append('file', file.slice(start, end, video.mimeType || 'video/mp4'), name);
    await new Promise<void>((resolve, reject) => {
      if (signal?.aborted) return reject(new Error('Đã hủy tải video.'));
      const xhr = new XMLHttpRequest();
      xhr.open('POST', url);
      for (const [key, value] of Object.entries(chunkHeaders(total > chunkSize, uploadId, start, end, total))) xhr.setRequestHeader(key, value);
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable && event.total > 0) {
          const sent = start + (event.loaded / event.total) * (end - start);
          onProgress(Math.min(99, Math.round((sent / total) * 100)));
        }
      };
      xhr.onerror = () => reject(new Error('Tải video lên thất bại. Kiểm tra kết nối và thử lại.'));
      xhr.onabort = () => reject(new Error('Đã hủy tải video.'));
      xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(uploadFailure(xhr.status, xhr.responseText)));
      signal?.addEventListener('abort', () => xhr.abort(), { once: true });
      xhr.send(body);
    });
  }
}

/**
 * Android/iOS: the OS streams the file in a native multipart upload, so no video bytes pass through
 * JavaScript (a `Blob` cannot be built from bytes in React Native, and encoding a chunk as base64
 * for XHR is far too slow). A video above `chunkSize` is copied one chunk at a time to a cache file,
 * which is uploaded with the chunk's `Content-Range`.
 */
async function uploadFromDevice(
  video: SelectedComposeVideo,
  { url, fields, chunkSize }: VideoUploadTarget['upload'],
  uploadId: string,
  onProgress: (percentage: number | null) => void,
  signal?: AbortSignal,
) {
  const file = new File(video.uri);
  if (!file.exists || file.size === 0) throw new Error('Không đọc được video đã chọn. Vui lòng chọn lại.');
  const total = file.size;
  const mimeType = video.mimeType || 'video/mp4';

  async function sendPart(part: File, start: number, end: number) {
    const task = part.createUploadTask(url, {
      httpMethod: 'POST',
      uploadType: UploadType.MULTIPART,
      fieldName: 'file',
      mimeType,
      parameters: fields,
      headers: chunkHeaders(total > chunkSize, uploadId, start, end, total),
      sessionType: 'foreground',
      signal,
      onProgress: ({ bytesSent, totalBytes }) => {
        if (totalBytes <= 0) return;
        const sent = start + Math.min(1, bytesSent / totalBytes) * (end - start);
        onProgress(Math.min(99, Math.round((sent / total) * 100)));
      },
    });
    try {
      const result = await task.uploadAsync();
      if (result.status < 200 || result.status >= 300) throw uploadFailure(result.status, result.body);
    } finally {
      task.release();
    }
  }

  if (total <= chunkSize) {
    await sendPart(file, 0, total);
    return;
  }

  const handle = file.open(FileMode.ReadOnly);
  const part = new File(Paths.cache, `vedora-upload-${uploadId}.part`);
  try {
    for (let start = 0; start < total; start += chunkSize) {
      const end = Math.min(start + chunkSize, total);
      handle.offset = start;
      part.create({ overwrite: true });
      part.write(handle.readBytes(end - start));
      await sendPart(part, start, end);
    }
  } finally {
    handle.close();
    if (part.exists) part.delete();
  }
}
