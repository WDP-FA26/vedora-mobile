import { z } from 'zod';

export const MAX_POST_LENGTH = 280;
export const MAX_VIDEO_DURATION_SECONDS = 180;

export const videoUploadTargetSchema = z.object({
  media: z.object({ id: z.string().min(1) }),
  uploadUrl: z.url(),
});

export const createdPostSchema = z.object({
  id: z.string().min(1),
  status: z.enum(['PROCESSING', 'PUBLISHED', 'FAILED']),
});

export const createPostInputSchema = z.object({
  type: z.literal('POST'),
  body: z.string().trim().min(1).max(MAX_POST_LENGTH),
  mediaIds: z.array(z.string().min(1)).max(4).optional(),
});

export type SelectedComposeVideo = {
  uri: string;
  fileName?: string;
  durationSeconds?: number;
  sizeBytes?: number;
  mimeType?: string;
  /** Web picker only. Native uploads use the file URI. */
  file?: globalThis.File;
};

export type CreatedPost = z.output<typeof createdPostSchema>;
