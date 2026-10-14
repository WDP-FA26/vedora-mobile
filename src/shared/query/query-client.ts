import { QueryClient } from '@tanstack/react-query';
import { z } from 'zod';

import { ApiError } from '@/shared/api/api-error';

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        gcTime: 5 * 60_000,
        retry: (failureCount, error) => {
          if (error instanceof z.ZodError) return false;
          if (error instanceof ApiError && error.status !== null) {
            if (error.status >= 400 && error.status < 500 && error.status !== 429) return false;
          }
          return failureCount < 2;
        },
      },
      mutations: { retry: false },
    },
  });
}
