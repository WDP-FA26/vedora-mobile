import { useQuery } from '@tanstack/react-query';

import { blogsKeys } from '../data/blogs.keys';
import { getBlog } from '../services/blogs.service';

export function useBlog(blogId: string, enabled = true) {
  return useQuery({
    queryKey: blogsKeys.detail(blogId),
    queryFn: ({ signal }) => getBlog(blogId, signal),
    enabled,
  });
}
