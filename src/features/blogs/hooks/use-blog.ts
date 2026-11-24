import { useQuery } from '@tanstack/react-query';

import { blogsKeys } from '../data/blogs.keys';
import { getBlog } from '../services/blogs.service';
import { isPostProcessing } from '@/features/posts/utils/post-status';

export function useBlog(blogId: string, enabled = true) {
  return useQuery({
    queryKey: blogsKeys.detail(blogId),
    queryFn: ({ signal }) => getBlog(blogId, signal),
    enabled,
    refetchInterval: (query) => query.state.data && isPostProcessing(query.state.data.status) ? 5000 : false,
  });
}
