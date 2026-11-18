import { z } from 'zod';

export const MAX_POST_LENGTH = 280;
export const MAX_VIDEO_DURATION_SECONDS = 180;

export const videoUploadTargetSchema = z.object({
  media: z.object({ id: z.string().min(1) }),
  upload: z.object({
    url: z.url(),
    fields: z.record(z.string(), z.string()),
    /** Larger files go in chunks of this many bytes. */
    chunkSize: z.number().positive(),
  }),
});

export type VideoUploadTarget = z.output<typeof videoUploadTargetSchema>;

const mediaStatuses = ['WAITING_UPLOAD', 'PROCESSING', 'READY', 'FAILED'] as const;

/** A video attached to a draft (`/media` shape, only the fields the app reads). */
export const draftMediaSchema = z.object({
  id: z.string(),
  status: z.enum(mediaStatuses),
  failureReason: z.string().nullable(),
  playbackUrl: z.string().nullable(),
  posterUrl: z.string().nullable(),
  durationSec: z.number().nullable(),
});

/** A private DRAFT post (`/posts/drafts`); `version` must be sent back with every change. */
export const postDraftSchema = z.object({
  id: z.string(),
  kind: z.enum(['POST', 'VIDEO']),
  title: z.string(),
  description: z.string(),
  version: z.number().int().nonnegative(),
  updatedAt: z.string(),
  media: z.array(draftMediaSchema),
});

export const postDraftPageSchema = z.object({ items: z.array(postDraftSchema) });

/** `upload` is null once the file is already on Cloudinary (a retry after the bytes went through). */
export const draftUploadSchema = z.object({
  draft: postDraftSchema,
  upload: videoUploadTargetSchema.shape.upload.nullable(),
});

/** The published post; a retried publish returns the same post in whatever status it reached. */
export const publishedDraftSchema = z.object({ id: z.string(), status: z.string() });

export type DraftMedia = z.output<typeof draftMediaSchema>;
export type PostDraft = z.output<typeof postDraftSchema>;

export type SelectedComposeVideo = {
  uri: string;
  fileName?: string;
  durationSeconds?: number;
  sizeBytes?: number;
  mimeType?: string;
  /** Web picker only. Native uploads use the file URI. */
  file?: globalThis.File;
};

