import { create } from 'zustand';

import type { SelectedComposeVideo } from '../types/compose.schema';

export type VideoPublishStatus = 'uploading' | 'posting' | 'failed' | 'published' | 'processing';

export type VideoPublishJob = {
  id: number;
  title: string;
  description: string;
  video: SelectedComposeVideo;
  status: VideoPublishStatus;
  /** 0-100 while uploading; null before the first progress event. */
  progress: number | null;
  error?: string;
  /** Set once the video is on Cloudinary, so a retry only has to create the post again. */
  mediaId: string | null;
};

type VideoPublishState = {
  job: VideoPublishJob | null;
  start: (job: Omit<VideoPublishJob, 'id' | 'status' | 'progress' | 'mediaId'>) => VideoPublishJob;
  patch: (id: number, patch: Partial<VideoPublishJob>) => void;
  clear: (id?: number) => void;
};

let nextId = 1;

/** The background video publish. It outlives the compose dialog so the user can leave the form. */
export const useVideoPublishStore = create<VideoPublishState>()((set, get) => ({
  job: null,
  start: (input) => {
    const job: VideoPublishJob = { ...input, id: nextId++, status: 'uploading', progress: null, mediaId: null };
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
  return job?.status === 'uploading' || job?.status === 'posting';
}
