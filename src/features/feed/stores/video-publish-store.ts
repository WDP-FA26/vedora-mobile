import { create } from 'zustand';

import type { SelectedComposeVideo } from '../types/compose.schema';

export type VideoPublishStatus = 'saving' | 'uploading' | 'posting' | 'failed' | 'saved' | 'published' | 'processing';

export type VideoPublishJob = {
  id: number;
  /** The server draft this job writes to; the same draft is reused by every retry. */
  draftId: string;
  /** False: only save the draft (text and video) and stop before publishing. */
  publish: boolean;
  title: string;
  description: string;
  /** A newly picked file to upload; null keeps the video the draft already has (`keepMediaId`). */
  video: SelectedComposeVideo | null;
  /** The draft's existing video the form still shows; any other attached video is removed. */
  keepMediaId: string | null;
  /** Stable ID for uploading `video`, so a retry resumes the same attachment. */
  uploadMediaId: string | null;
  /** Set once `video` is on Cloudinary, so a retry skips the upload. */
  uploaded: boolean;
  status: VideoPublishStatus;
  /** 0-100 while uploading; null before the first progress event. */
  progress: number | null;
  error?: string;
};

type VideoPublishState = {
  job: VideoPublishJob | null;
  start: (job: Pick<VideoPublishJob, 'draftId' | 'publish' | 'title' | 'description' | 'video' | 'keepMediaId'>) => VideoPublishJob;
  patch: (id: number, patch: Partial<VideoPublishJob>) => void;
  clear: (id?: number) => void;
};

let nextId = 1;

/** The background save/publish of a video draft. It outlives the compose dialog so the user can leave the form. */
export const useVideoPublishStore = create<VideoPublishState>()((set, get) => ({
  job: null,
  start: (input) => {
    const job: VideoPublishJob = { ...input, id: nextId++, status: 'saving', progress: null, uploadMediaId: null, uploaded: false };
    set({ job });
    return job;
  },
  patch: (id, patch) => {
    if (get().job?.id === id) set((state) => ({ job: state.job && { ...state.job, ...patch } }));
  },
  clear: (id) => {
    if (id === undefined || get().job?.id === id) set({ job: null });
  },
}));

export function isVideoPublishActive(job: VideoPublishJob | null) {
  return job?.status === 'saving' || job?.status === 'uploading' || job?.status === 'posting';
}
