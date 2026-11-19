import { apiClient } from '@/shared/api/api-client';
import { useSessionStore } from '@/shared/stores/session-store';

import { postViewsInputSchema } from '../types/post-view.schema';

export async function recordPostViews(postIds: string[], signal?: AbortSignal) {
  const data = postViewsInputSchema.parse({ postIds });
  const controller = new AbortController();
  const abort = () => controller.abort();
  const unsubscribe = useSessionStore.subscribe((state, previous) => {
    if (state.accessToken !== previous.accessToken) abort();
  });
  if (signal?.aborted) abort();
  signal?.addEventListener('abort', abort);
  try {
    await apiClient.request({ method: 'POST', url: '/posts/views', data, signal: controller.signal });
  } finally {
    unsubscribe(); signal?.removeEventListener('abort', abort);
  }
}
