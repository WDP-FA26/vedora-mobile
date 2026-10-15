import { File, UploadType } from 'expo-file-system';
import { Platform } from 'react-native';

import { apiClient } from '@/shared/api/api-client';
import { requestJson } from '@/shared/api/request-json';

import {
  createPostInputSchema,
  createdPostSchema,
  videoUploadTargetSchema,
  type SelectedComposeVideo,
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

/** Uploads to Mux's signed URL, never through the Vedora API client. */
export async function uploadVideoToMux(
  video: SelectedComposeVideo,
  uploadUrl: string,
  onProgress: (percentage: number | null) => void,
) {
  const mimeType = video.mimeType || video.file?.type || 'application/octet-stream';
  onProgress(null);

  if (Platform.OS === 'web') {
    if (!video.file) throw new Error('Không đọc được video đã chọn. Vui lòng chọn lại.');
    await new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('PUT', uploadUrl);
      xhr.setRequestHeader('Content-Type', mimeType);
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable && event.total > 0) {
          onProgress(Math.min(100, Math.round((event.loaded / event.total) * 100)));
        }
      };
      xhr.onerror = () => reject(new Error('Tải video lên thất bại. Kiểm tra kết nối và thử lại.'));
      xhr.onabort = () => reject(new Error('Đã hủy tải video.'));
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) resolve();
        else reject(new Error(`Tải video lên thất bại (HTTP ${xhr.status}).`));
      };
      xhr.send(video.file);
    });
    return;
  }

  const file = new File(video.uri);
  if (!file.exists || file.size === 0) {
    throw new Error('Không đọc được video đã chọn. Vui lòng chọn lại.');
  }
  const task = file.createUploadTask(uploadUrl, {
    httpMethod: 'PUT',
    uploadType: UploadType.BINARY_CONTENT,
    mimeType,
    headers: { 'Content-Type': mimeType },
    onProgress: ({ bytesSent, totalBytes }) => {
      if (totalBytes > 0) onProgress(Math.min(100, Math.round((bytesSent / totalBytes) * 100)));
    },
  });
  try {
    const result = await task.uploadAsync();
    if (result.status < 200 || result.status >= 300) {
      throw new Error(`Tải video lên thất bại (HTTP ${result.status}).`);
    }
  } finally {
    task.release();
  }
}
