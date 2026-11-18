import { File, UploadType, type UploadTask } from 'expo-file-system';
import { Platform } from 'react-native';

const UPLOAD_TIMEOUT_MS = 60_000;

/** Upload directly to signed storage without API auth headers, with a total deadline. */
export async function uploadImageToStorage(
  upload: { url: string; headers: Record<string, string> },
  image: { uri: string; file?: globalThis.File },
  contentType: string,
) {
  const headers = { ...upload.headers, 'Content-Type': upload.headers['Content-Type'] ?? contentType };
  const controller = new AbortController();
  let task: UploadTask | undefined;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const deadline = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      // Settle the UI even if the native request does not acknowledge cancellation.
      reject(new Error('Tải ảnh quá lâu. Kiểm tra kết nối mạng rồi chọn ảnh để thử lại.'));
      controller.abort();
    }, UPLOAD_TIMEOUT_MS);
  });

  async function transfer() {
    if (Platform.OS === 'web') {
      if (!image.file) throw new Error('Không đọc được ảnh đã chọn.');
      const response = await fetch(upload.url, { method: 'PUT', headers, body: image.file, signal: controller.signal });
      if (!response.ok) throw new Error(`Tải ảnh lên thất bại (HTTP ${response.status}).`);
      return;
    }
    const file = new File(image.uri);
    if (!file.exists || file.size === 0) throw new Error('Không đọc được ảnh đã chọn.');
    task = file.createUploadTask(upload.url, {
      httpMethod: 'PUT',
      uploadType: UploadType.BINARY_CONTENT,
      mimeType: contentType,
      headers,
      signal: controller.signal,
    });
    const result = await task.uploadAsync();
    if (result.status < 200 || result.status >= 300) throw new Error(`Tải ảnh lên thất bại (HTTP ${result.status}).`);
  }

  try {
    await Promise.race([transfer(), deadline]);
  } finally {
    clearTimeout(timer);
    task?.release();
  }
}
