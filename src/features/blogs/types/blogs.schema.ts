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

export const MAX_BLOG_TITLE_LENGTH = 150;
export const MAX_BLOG_CONTENT_LENGTH = 50_000;
export const blogInputSchema = z.object({
  title: z.string().trim().min(1, 'Nhập tiêu đề blog.').max(MAX_BLOG_TITLE_LENGTH, 'Tiêu đề tối đa 150 ký tự.'),
  content: z.string().max(MAX_BLOG_CONTENT_LENGTH, 'Nội dung tối đa 50.000 ký tự.'),
  coverImageUrl: z.union([z.url().max(2048).refine((url) => /^https?:\/\//.test(url), 'Dùng đường dẫn ảnh HTTP hoặc HTTPS.'), z.null()]),
  status: z.enum(['DRAFT', 'PUBLISHED']),
}).superRefine((input, ctx) => {
  if (input.status === 'PUBLISHED' && !input.content.trim()) {
    ctx.addIssue({ code: 'custom', path: ['content'], message: 'Hãy viết nội dung trước khi đăng.' });
  }
});

export const blogPageSchema = z.object({
  items: z.array(blogSchema.omit({ content: true, updatedAt: true }).extend({ createdAt: z.string() })),
  nextCursor: z.string().nullable(),
});
export const blogImageUploadSchema = z.object({
  upload: z.object({ url: z.url(), method: z.literal('PUT'), headers: z.record(z.string(), z.string()), expiresAt: z.string() }),
  url: z.url(),
});
export type BlogInput = z.input<typeof blogInputSchema>;
