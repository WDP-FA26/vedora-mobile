import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import { useRef } from 'react';
import { Platform } from 'react-native';

import { feedKeys } from '../data/feed.keys';
import {
  createPost,
  discardVideoUpload,
  requestVideoUpload,
  uploadVideoToCloudinary,
} from '../services/compose.service';
import { MAX_POST_LENGTH, MAX_VIDEO_DURATION_SECONDS, type SelectedComposeVideo } from '../types/compose.schema';
import { composeVideoBody, filledDescription } from '../utils/compose-body';

type VideoDraft = { title: string; description: string; video: SelectedComposeVideo };

function releaseWebVideoUri(uri: string) {
  if (Platform.OS === 'web' && uri.startsWith('blob:')) URL.revokeObjectURL(uri);
}

export function useComposeActions() {
  const queryClient = useQueryClient();
  const uploadedVideo = useRef<{ uri: string; mediaId: string } | null>(null);
  const publishing = useRef(false);
  const create = useMutation({
    mutationFn: ({ body, mediaIds }: { body: string; mediaIds?: string[] }) => createPost(body, mediaIds),
    onSuccess: (post) => {
      if (post.status === 'PUBLISHED') void queryClient.invalidateQueries({ queryKey: feedKeys.all });
    },
  });

  async function pickVideo(): Promise<SelectedComposeVideo | null> {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['videos'],
      allowsMultipleSelection: false,
      allowsEditing: false,
    });
    if (result.canceled || !result.assets?.length) return null;
    const asset = result.assets[0];
    if (asset.type && asset.type !== 'video') {
      releaseWebVideoUri(asset.uri);
      throw new Error('Vui lòng chọn một tệp video.');
    }
    const video: SelectedComposeVideo = {
      uri: asset.uri,
      fileName: asset.fileName || asset.file?.name || 'Video hướng dẫn',
      // Expo's web picker returns HTMLVideoElement.duration (seconds); native returns milliseconds.
      durationSeconds: typeof asset.duration === 'number'
        ? Platform.OS === 'web' ? asset.duration : asset.duration / 1000
        : undefined,
      sizeBytes: asset.fileSize ?? asset.file?.size,
      mimeType: asset.mimeType || asset.file?.type || undefined,
      file: asset.file,
    };
    if (video.durationSeconds && video.durationSeconds > MAX_VIDEO_DURATION_SECONDS) {
      releaseWebVideoUri(video.uri);
      throw new Error('Video tối đa 3 phút. Vui lòng chọn video ngắn hơn.');
    }
    if (uploadedVideo.current && uploadedVideo.current.uri !== video.uri) {
      const mediaId = uploadedVideo.current.mediaId;
      uploadedVideo.current = null;
      void discardVideoUpload(mediaId).catch(() => undefined);
    }
    return video;
  }

  async function publishVideo(draft: VideoDraft, onProgress: (progress: number | null) => void) {
    const title = draft.title.trim();
    const description = filledDescription(draft.description);
    const body = composeVideoBody(title, draft.description);
    if (!title) throw new Error('Nhập tiêu đề video.');
    if (!description) throw new Error('Nhập mô tả hoặc các bước hướng dẫn.');
    if (body.length > MAX_POST_LENGTH) throw new Error(`Nội dung tối đa ${MAX_POST_LENGTH} ký tự.`);
    if (draft.video.durationSeconds && draft.video.durationSeconds > MAX_VIDEO_DURATION_SECONDS) {
      throw new Error('Video tối đa 3 phút. Vui lòng chọn video ngắn hơn.');
    }
    if (publishing.current) throw new Error('Video đang được gửi.');
    publishing.current = true;
    try {
      let mediaId = uploadedVideo.current?.uri === draft.video.uri ? uploadedVideo.current.mediaId : null;
      if (!mediaId) {
        const target = await requestVideoUpload();
        try {
          await uploadVideoToCloudinary(draft.video, target.upload, onProgress);
        } catch (error) {
          void discardVideoUpload(target.media.id).catch(() => undefined);
          throw error;
        }
        mediaId = target.media.id;
        uploadedVideo.current = { uri: draft.video.uri, mediaId };
      }
      onProgress(100);
      const post = await create.mutateAsync({ body, mediaIds: [mediaId] });
      // A failed processing result cannot be reused for a later upload attempt.
      uploadedVideo.current = null;
      return { status: post.status };
    } finally {
      publishing.current = false;
    }
  }

  function discardDraftUpload() {
    const mediaId = uploadedVideo.current?.mediaId;
    uploadedVideo.current = null;
    if (mediaId) void discardVideoUpload(mediaId).catch(() => undefined);
  }

  function removeVideo(video: SelectedComposeVideo) {
    releaseWebVideoUri(video.uri);
    if (uploadedVideo.current?.uri === video.uri) discardDraftUpload();
  }

  return { pickVideo, publishVideo, discardDraftUpload, removeVideo };
}
