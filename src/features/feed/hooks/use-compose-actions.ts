import { useQueryClient, type QueryClient } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import { Platform } from 'react-native';

import { feedKeys } from '../data/feed.keys';
import {
  createPost,
  discardVideoUpload,
  requestVideoUpload,
  uploadVideoToCloudinary,
} from '../services/compose.service';
import { isVideoPublishActive, useVideoPublishStore, type VideoPublishJob } from '../stores/video-publish-store';
import { MAX_POST_LENGTH, MAX_VIDEO_DURATION_SECONDS, type SelectedComposeVideo } from '../types/compose.schema';
import { composeVideoBody, filledDescription } from '../utils/compose-body';

type VideoDraft = { title: string; description: string; video: SelectedComposeVideo };

/** The finished-job banner stays this long before it clears itself. */
const DONE_BANNER_MS = 8000;

function releaseWebVideoUri(uri: string) {
  if (Platform.OS === 'web' && uri.startsWith('blob:')) URL.revokeObjectURL(uri);
}

function assertValidDraft(draft: VideoDraft) {
  const title = draft.title.trim();
  if (!title) throw new Error('Nhập tiêu đề video.');
  if (!filledDescription(draft.description)) throw new Error('Nhập mô tả hoặc các bước hướng dẫn.');
  if (composeVideoBody(title, draft.description).length > MAX_POST_LENGTH) throw new Error(`Nội dung tối đa ${MAX_POST_LENGTH} ký tự.`);
  if (draft.video.durationSeconds && draft.video.durationSeconds > MAX_VIDEO_DURATION_SECONDS) {
    throw new Error('Video tối đa 3 phút. Vui lòng chọn video ngắn hơn.');
  }
}

/**
 * Uploads the video, then creates the post. Runs against the store rather than a component, so it
 * keeps going after the compose dialog closes. A retry skips the upload when the video already made it.
 */
async function runVideoPublish(queryClient: QueryClient, jobId: number) {
  const { patch, clear } = useVideoPublishStore.getState();
  const job = useVideoPublishStore.getState().job;
  if (!job || job.id !== jobId) return;
  const finish = (status: 'published' | 'processing') => {
    patch(jobId, { status, progress: 100, error: undefined });
    releaseWebVideoUri(job.video.uri);
    setTimeout(() => clear(jobId), DONE_BANNER_MS);
  };

  try {
    let mediaId = job.mediaId;
    if (!mediaId) {
      patch(jobId, { status: 'uploading', progress: null, error: undefined });
      const target = await requestVideoUpload();
      try {
        await uploadVideoToCloudinary(job.video, target.upload, (progress) => patch(jobId, { progress }));
      } catch (error) {
        void discardVideoUpload(target.media.id).catch(() => undefined);
        throw error;
      }
      mediaId = target.media.id;
      patch(jobId, { mediaId });
    }
    patch(jobId, { status: 'posting', progress: 100 });
    const post = await createPost(composeVideoBody(job.title, job.description), [mediaId]);
    if (post.status === 'FAILED') {
      // A failed processing result cannot be reused for a later attempt.
      patch(jobId, { status: 'failed', mediaId: null, error: 'Video chưa được đăng. Bạn có thể thử lại.' });
      return;
    }
    if (post.status === 'PUBLISHED') void queryClient.invalidateQueries({ queryKey: feedKeys.all });
    finish(post.status === 'PUBLISHED' ? 'published' : 'processing');
  } catch (error) {
    patch(jobId, { status: 'failed', error: error instanceof Error ? error.message : 'Chưa thể đăng video. Bạn có thể thử lại.' });
  }
}

export function useComposeActions() {
  const queryClient = useQueryClient();

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
    return video;
  }

  /** Validates the draft and starts publishing in the background; the caller may close the dialog at once. */
  function startVideoPublish(draft: VideoDraft) {
    if (isVideoPublishActive(useVideoPublishStore.getState().job)) throw new Error('Một video khác đang được đăng. Vui lòng đợi xong.');
    assertValidDraft(draft);
    const job = useVideoPublishStore.getState().start({ title: draft.title.trim(), description: draft.description, video: draft.video });
    void runVideoPublish(queryClient, job.id);
  }

  function retryVideoPublish() {
    const job = useVideoPublishStore.getState().job;
    if (job?.status === 'failed') void runVideoPublish(queryClient, job.id);
  }

  function dismissVideoPublish(job: VideoPublishJob) {
    if (isVideoPublishActive(job)) return;
    if (job.status === 'failed') {
      if (job.mediaId) void discardVideoUpload(job.mediaId).catch(() => undefined);
      releaseWebVideoUri(job.video.uri);
    }
    useVideoPublishStore.getState().clear(job.id);
  }

  /** The picked video is no longer wanted by the form; the background job keeps its own reference. */
  function removeVideo(video: SelectedComposeVideo) {
    if (useVideoPublishStore.getState().job?.video.uri !== video.uri) releaseWebVideoUri(video.uri);
  }

  return { pickVideo, startVideoPublish, retryVideoPublish, dismissVideoPublish, removeVideo };
}
