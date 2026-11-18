import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { File } from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import { useEffect } from 'react';
import { Platform } from 'react-native';

import { profileKeys } from '@/features/profile/data/profile.keys';
import { uploadImageToStorage } from '@/shared/api/upload-image';
import { useSessionStore } from '@/shared/stores/session-store';

import { verificationKeys } from '../data/verification.keys';
import { getMyVerification, requestProofUpload, submitVerification } from '../services/verification.service';
import { proofInputSchema, type MyVerification } from '../types/verification.schema';

export function useMyVerification() {
  const token = useSessionStore((state) => state.accessToken);
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: verificationKeys.me,
    queryFn: ({ signal }) => getMyVerification(signal),
    enabled: !!token,
    refetchInterval: (query) => query.state.data?.request?.status === 'PENDING' ? 15_000 : false,
  });
  const professional = query.data?.isProfessional;
  useEffect(() => {
    if (professional === undefined) return;
    void queryClient.invalidateQueries({ queryKey: profileKeys.all });
  }, [professional, queryClient]);
  return query;
}

export function useSubmitVerification() {
  const queryClient = useQueryClient();
  const token = useSessionStore((state) => state.accessToken);
  return useMutation({
    mutationFn: submitVerification,
    networkMode: 'always',
    retry: false,
    onSuccess: (request) => {
      if (!token || useSessionStore.getState().accessToken !== token) return;
      queryClient.setQueryData<MyVerification>(verificationKeys.me, { isProfessional: false, request });
    },
    onSettled: () => {
      if (token && useSessionStore.getState().accessToken === token) {
        void queryClient.invalidateQueries({ queryKey: verificationKeys.me });
      }
    },
  });
}

export function useUploadProof() {
  return useMutation({
    networkMode: 'always',
    retry: false,
    mutationFn: async () => {
      const picked = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 1 });
      if (picked.canceled) return null;
      const image = picked.assets[0];
      const input = proofInputSchema.parse({
        contentType: image.mimeType ?? image.file?.type ?? '',
        sizeBytes: image.fileSize ?? image.file?.size ?? (Platform.OS !== 'web' ? new File(image.uri).size : 0),
      });
      const target = await requestProofUpload(input);
      await uploadImageToStorage(target.upload, image, input.contentType);
      return { id: target.id, uri: image.uri };
    },
  });
}
