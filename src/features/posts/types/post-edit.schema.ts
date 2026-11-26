import { z } from 'zod';

// Defaults from the backend's POST_MAX_LENGTH, POST_MAX_WORDS and POST_MAX_MEDIA.
export const MAX_POST_BODY_LENGTH = 2000;
export const MAX_POST_BODY_WORDS = 250;
export const MAX_POST_MEDIA = 4;
export const postWordCount = (body: string) => body.trim().split(/\s+/).filter(Boolean).length;

const bodySchema = z.string().trim().max(MAX_POST_BODY_LENGTH, `Tối đa ${MAX_POST_BODY_LENGTH} ký tự.`)
  .refine((body) => postWordCount(body) <= MAX_POST_BODY_WORDS, `Tối đa ${MAX_POST_BODY_WORDS} từ.`);
const mediaIdsSchema = z.array(z.uuidv4()).max(MAX_POST_MEDIA, `Tối đa ${MAX_POST_MEDIA} video.`)
  .refine((ids) => new Set(ids).size === ids.length, 'Video bị trùng.');

export const postUpdateSchema = z.object({ body: bodySchema.optional(), mediaIds: mediaIdsSchema.optional() }).strict()
  .refine((input) => input.body !== undefined || input.mediaIds !== undefined, 'Chưa có nội dung cần cập nhật.');

export const postEditFormSchema = z.object({ body: bodySchema, mediaIds: mediaIdsSchema })
  .refine((input) => !!input.body || input.mediaIds.length > 0, 'Bài viết cần có nội dung hoặc ít nhất một video.');

export type PostUpdate = z.input<typeof postUpdateSchema>;
