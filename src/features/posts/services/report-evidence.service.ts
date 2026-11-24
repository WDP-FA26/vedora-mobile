import { Platform } from 'react-native';
import { z } from 'zod';

import { requestJson } from '@/shared/api/request-json';

import { reportEvidenceInputSchema, reportEvidenceResponseSchema } from '../types/posts.schema';

export function uploadReportEvidence(postId: string, image: { uri: string; file?: globalThis.File }, input: z.input<typeof reportEvidenceInputSchema>) {
  const id = z.uuidv4().parse(postId);
  const { contentType } = reportEvidenceInputSchema.parse(input);
  const data = new FormData();
  if (Platform.OS === 'web') {
    if (!image.file) throw new Error('Không đọc được ảnh đã chọn.');
    data.append('file', image.file);
  } else {
    // React Native FormData sends local files by URI; the browser uses File above.
    data.append('file', { uri: image.uri, name: `evidence.${contentType === 'image/jpeg' ? 'jpg' : contentType.slice(6)}`, type: contentType } as unknown as Blob);
  }
  return requestJson(reportEvidenceResponseSchema, {
    method: 'POST', url: `/posts/${id}/report/evidence`, data, timeout: 60_000,
    headers: { 'Content-Type': Platform.OS === 'web' ? undefined : 'multipart/form-data' },
  });
}
