import { useQueryClient, type QueryClient } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import { Platform } from 'react-native';

import { createClientMessageId } from '@/features/messaging/utils/messaging';

import { feedKeys } from '../data/feed.keys';
import {
  createDraft,
  getDraft,
  publishDraft,
  removeDraftMedia,
  requestDraftUpload,
  saveDraft,
  uploadVideoToCloudinary,
} from '../services/compose.service';
import { isVideoPublishActive, useVideoPublishStore, type VideoPublishJob } from '../stores/video-publish-store';
import { MAX_POST_LENGTH, MAX_VIDEO_DURATION_SECONDS, type PostDraft, type SelectedComposeVideo } from '../types/compose.schema';
import { composeVideoBody, filledDescription } from '../utils/compose-body';

/** What the composer hands over: the draft's text, plus a new file or the draft's existing video to keep. */
export type VideoDraftInput = {
  draftId: string;
  title: string;
  description: string;
  video: SelectedComposeVideo | null;
  keepMediaId: string | null;
};

/** The finished-job banner stays this long before it clears itself. */
const DONE_BANNER_MS = 8000;
/** After the bytes reach Cloudinary the API needs a moment to see them; re-read the draft this often, this many times. */
const SETTLE_DELAY_MS = 1500;
const SETTLE_ATTEMPTS = 10;

function releaseWebVideoUri(uri: string) {
  if (Platform.OS === 'web' && uri.startsWith('blob:')) URL.revokeObjectURL(uri);
}

function assertPublishable(draft: VideoDraftInput) {
  const title = draft.title.trim();
  if (!title) throw new Error('Nhập tiêu đề video.');
  if (!filledDescription(draft.description)) throw new Error('Nhập mô tả hoặc các bước hướng dẫn.');
  if (composeVideoBody(title, draft.description).length > MAX_POST_LENGTH) throw new Error(`Nội dung tối đa ${MAX_POST_LENGTH} ký tự.`);
  if (!draft.video && !draft.keepMediaId) throw new Error('Chọn video hướng dẫn.');
  if (draft.video?.durationSeconds && draft.video.durationSeconds > MAX_VIDEO_DURATION_SECONDS) {
    throw new Error('Video tối đa 3 phút. Vui lòng chọn video ngắn hơn.');
  }
}

/** API refusals (an `ApiError` carries `status`) in the user's words; upload errors already arrive worded. */
function jobErrorText(error: unknown) {
  if (error instanceof Error && 'status' in error) {
    const { status, code } = error as Error & { status: number | null; code?: string };
    if (code === 'UPLOAD_LIMIT_REACHED') return 'Bạn đã đạt giới hạn số bản nháp. Hãy đăng hoặc xóa bớt bản nháp cũ.';
    if (code === 'MEDIA_UNAVAILABLE') return 'Video chưa tải xong hoặc bị lỗi. Hãy mở bản nháp và chọn lại video.';
    if (status === 409) return 'Bản nháp vừa được sửa ở nơi khác. Hãy mở lại bản nháp để xem bản mới nhất.';
    if (status === 404) return 'Không tìm thấy bản nháp. Có thể nó đã bị xóa.';
    if (status === 401) return 'Phiên đăng nhập đã hết hạn. Hãy đăng nhập lại rồi thử lại.';
    return 'Chưa lưu được bản nháp. Kiểm tra kết nối rồi thử lại.';
  }
  return error instanceof Error ? error.message : 'Chưa lưu được bản nháp. Bạn có thể thử lại.';
}

/** Re-reads the draft until no video is still waiting for its upload to be seen. */
async function settledDraft(id: string): Promise<PostDraft> {
  for (let attempt = 1; ; attempt++) {
    const draft = await getDraft(id);
    if (!draft.media.some((item) => item.status === 'WAITING_UPLOAD')) return draft;
    if (attempt >= SETTLE_ATTEMPTS) throw new Error('Video vẫn đang được nhận. Bản nháp đã lưu, bấm Thử lại sau ít phút.');
    await new Promise((resolve) => setTimeout(resolve, SETTLE_DELAY_MS));
  }
}

/**
 * Writes the composer's content into its server draft (text, then the video), and publishes it when
 * the job asks to. Runs against the store rather than a component, so it keeps going after the
 * dialog closes. Every step is safe to repeat, so a retry simply runs it again.
 */
async function runDraftJob(queryClient: QueryClient, jobId: number) {
  const { patch, clear } = useVideoPublishStore.getState();
  const current = () => useVideoPublishStore.getState().job;
  const job = current();
  if (!job || job.id !== jobId) return;
  const finish = (status: 'saved' | 'published' | 'processing') => {
    patch(jobId, { status, progress: 100, error: undefined });
    if (job.video) releaseWebVideoUri(job.video.uri);
    setTimeout(() => clear(jobId), DONE_BANNER_MS);
  };

  try {
    patch(jobId, { status: 'saving', error: undefined });
    let draft = await createDraft(job.draftId);
    draft = await saveDraft(job.draftId, {
      expectedVersion: draft.version,
      title: job.title,
      description: job.description,
      body: composeVideoBody(job.title, job.description),
    });

    let uploadMediaId = current()?.uploadMediaId ?? null;
    if (job.video && !uploadMediaId) {
      uploadMediaId = createClientMessageId();
      patch(jobId, { uploadMediaId });
    }
    // A video guide holds one video: drop whatever the form no longer shows before attaching a new one.
    const keep = job.video ? uploadMediaId : job.keepMediaId;
    for (const item of draft.media) {
      if (item.id !== keep) draft = await removeDraftMedia(job.draftId, item.id, draft.version);
    }

    if (job.video && uploadMediaId && !current()?.uploaded) {
      patch(jobId, { status: 'uploading', progress: null });
      const target = await requestDraftUpload(job.draftId, uploadMediaId);
      try {
        if (target.upload) await uploadVideoToCloudinary(job.video, target.upload, (progress) => patch(jobId, { progress }));
      } catch (error) {
        // An interrupted upload is not resumable: the retry starts the file again under a new ID.
        patch(jobId, { uploadMediaId: null });
        throw error;
      }
      patch(jobId, { uploaded: true });
    }
    void queryClient.invalidateQueries({ queryKey: feedKeys.drafts });
    if (!job.publish) {
      finish('saved');
      return;
    }

    patch(jobId, { status: 'posting', progress: 100 });
    draft = await settledDraft(job.draftId);
    if (draft.media.some((item) => item.status === 'FAILED')) {
      patch(jobId, { uploadMediaId: null, uploaded: false });
      throw new Error('Video bị lỗi khi xử lý. Bản nháp vẫn được lưu; hãy mở bản nháp và chọn video khác.');
    }
    const post = await publishDraft(job.draftId, draft.version);
    void queryClient.invalidateQueries({ queryKey: feedKeys.drafts });
    if (post.status === 'PUBLISHED') void queryClient.invalidateQueries({ queryKey: feedKeys.all });
    finish(post.status === 'PUBLISHED' ? 'published' : 'processing');
  } catch (error) {
    patch(jobId, { status: 'failed', error: jobErrorText(error) });
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

  function startJob(input: VideoDraftInput, publish: boolean) {
    if (isVideoPublishActive(useVideoPublishStore.getState().job)) throw new Error('Một video khác đang được lưu hoặc đăng. Vui lòng đợi xong.');
    const job = useVideoPublishStore.getState().start({ ...input, title: input.title.trim(), publish });
    void runDraftJob(queryClient, job.id);
  }

  /** Validates the draft and publishes it in the background; the caller may close the dialog at once. */
  function startVideoPublish(input: VideoDraftInput) {
    assertPublishable(input);
    startJob(input, true);
  }

  /** Saves the form into its draft in the background, uploading a newly picked video too. */
  function saveVideoDraft(input: VideoDraftInput) {
    if (!input.title.trim() && !input.description.trim() && !input.video && !input.keepMediaId) throw new Error('Bản nháp đang trống.');
    startJob(input, false);
  }

  function retryVideoPublish() {
    const job = useVideoPublishStore.getState().job;
    if (job?.status === 'failed') void runDraftJob(queryClient, job.id);
  }

  /** The draft stays on the server, so dismissing only hides the banner. */
  function dismissVideoPublish(job: VideoPublishJob) {
    if (isVideoPublishActive(job)) return;
    if (job.video) releaseWebVideoUri(job.video.uri);
    useVideoPublishStore.getState().clear(job.id);
  }

  /** The picked video is no longer wanted by the form; the background job keeps its own reference. */
  function removeVideo(video: SelectedComposeVideo) {
    if (useVideoPublishStore.getState().job?.video?.uri !== video.uri) releaseWebVideoUri(video.uri);
  }

  return { pickVideo, startVideoPublish, saveVideoDraft, retryVideoPublish, dismissVideoPublish, removeVideo };
}
