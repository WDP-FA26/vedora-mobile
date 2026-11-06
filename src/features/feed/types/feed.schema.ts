import { z } from 'zod';

const captionSchema = z.object({
  languageCode: z.string(),
  name: z.string(),
  isOriginal: z.boolean(),
  /** Public WebVTT file. */
  url: z.string(),
});

const mediaSchema = z.object({
  id: z.uuid(),
  type: z.enum(['VIDEO', 'IMAGE']),
  status: z.enum(['WAITING_UPLOAD', 'PROCESSING', 'READY', 'FAILED']),
  failureReason: z.string().nullable(),
  publicId: z.string().optional(),
  /** Adaptive HLS stream, set once READY. */
  playbackUrl: z.string().nullable(),
  /** First frame as JPEG, set once READY. */
  posterUrl: z.string().nullable(),
  durationSec: z.number().nullable(),
  /** "width:height", for example "9:16". */
  aspectRatio: z.string().nullable(),
  captions: z.array(captionSchema).default([]),
});

export const feedPostSchema = z.object({
  id: z.uuid(),
  type: z.enum(['POST', 'BLOG']),
  status: z.enum(['DRAFT', 'PROCESSING', 'PUBLISHED', 'FAILED']),
  body: z.string().nullable(),
  blog: z.object({
    title: z.string(),
    coverImageUrl: z.string().nullable(),
    excerpt: z.string(),
    recipes: z.array(z.object({ id: z.uuid(), title: z.string(), imageUrl: z.string().nullable() })),
  }).nullish(),
  publishedAt: z.string().nullable(),
  createdAt: z.string(),
  author: z.object({
    id: z.uuid(),
    username: z.string(),
    fullName: z.string(),
    avatarUrl: z.string().nullable().optional(),
  }),
  media: z.array(mediaSchema),
  commentCount: z.number().int().nonnegative(),
  likeCount: z.number().int().nonnegative(),
  isLiked: z.boolean(),
  repostCount: z.number().int().nonnegative(),
  isReposted: z.boolean(),
  isBookmarked: z.boolean(),
  viewCount: z.number().int().nonnegative(),
});

export const feedPageSchema = z.object({
  items: z.array(feedPostSchema),
  nextCursor: z.string().nullable(),
});

export const likeResponseSchema = z.object({
  isLiked: z.boolean(),
  likeCount: z.number().int().nonnegative(),
});

export const bookmarkResponseSchema = z.object({
  isBookmarked: z.boolean(),
});

export const repostResponseSchema = z.object({
  isReposted: z.boolean(),
  repostCount: z.number().int().nonnegative(),
});

export type FeedPost = z.output<typeof feedPostSchema>;
export type FeedPage = z.output<typeof feedPageSchema>;
export type FeedFilter = 'all' | 'posts' | 'blogs';
