import { requestJson } from '@/shared/api/request-json';

import { blogSchema } from '../types/blogs.schema';

export function getBlog(blogId: string, signal?: AbortSignal) {
  return requestJson(blogSchema, { method: 'GET', url: `/blogs/${blogId}`, signal });
}
