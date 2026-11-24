import { useMutation } from '@tanstack/react-query';
import { File } from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import { Platform } from 'react-native';

import { ApiError } from '@/shared/api/api-error';
import { useSessionStore } from '@/shared/stores/session-store';

import { uploadReportEvidence } from '../services/report-evidence.service';
import { reportEvidenceInputSchema } from '../types/posts.schema';

export function useReportEvidence(postId: string) {
  const token = useSessionStore((state) => state.accessToken);
  return useMutation({
    networkMode: 'always', retry: false,
    mutationFn: async () => {
      const assertSession = () => {
        if (!token || useSessionStore.getState().accessToken !== token) throw new ApiError(401, 'SESSION_CHANGED', 'Session changed');
      };
      assertSession();
      const picked = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 1 });
      if (picked.canceled) return null;
      assertSession();
      const image = picked.assets[0];
      const input = reportEvidenceInputSchema.parse({
        contentType: image.mimeType ?? image.file?.type ?? '',
        sizeBytes: image.fileSize ?? image.file?.size ?? (Platform.OS !== 'web' ? new File(image.uri).size : 0),
      });
      const result = await uploadReportEvidence(postId, image, input);
      assertSession();
      return { id: result.id, uri: image.uri };
    },
  });
}
