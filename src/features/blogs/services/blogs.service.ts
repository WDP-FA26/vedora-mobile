import { requestJson } from '@/shared/api/request-json';

import { blogImageUploadSchema, blogInputSchema, blogPageSchema, blogSchema, type BlogInput } from '../types/blogs.schema';

export function getBlog(blogId: string, signal?: AbortSignal) {
  return requestJson(blogSchema, { method: 'GET', url: `/blogs/${blogId}`, signal });
}

export function getMyBlogs(cursor: string | null, signal?: AbortSignal) {
  return requestJson(blogPageSchema, { method: 'GET', url: '/blogs/mine', params: { limit: 20, ...(cursor ? { cursor } : {}) }, signal });
}

export function saveBlog(id: string | null, input: BlogInput) {
  return requestJson(blogSchema, {
    method: id ? 'PATCH' : 'POST',
    url: id ? `/blogs/${id}` : '/blogs',
    data: blogInputSchema.parse(input),
  });
}

export function requestBlogImageUpload(contentType: string, sizeBytes: number) {
  return requestJson(blogImageUploadSchema, { method: 'POST', url: '/blogs/images/uploads', data: { contentType, sizeBytes } });
}
