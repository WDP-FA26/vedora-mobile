import { z } from 'zod';

/** Mirrors vedora-api's `GET /blogs/:id`: the full article, which feed items only summarise. */
export const blogSchema = z.object({
  id: z.string(),
  status: z.enum(['DRAFT', 'PUBLISHED']),
  content: z.string(),
  updatedAt: z.string(),
  blog: z.object({
    title: z.string(),
    coverImageUrl: z.string().nullable(),
    excerpt: z.string(),
  }),
});

export type Blog = z.output<typeof blogSchema>;
