import { useMutation, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { requestJson } from '@/shared/api/request-json';
import { switchSession } from '@/shared/session/session-manager';
import { authResponseSchema } from '@/shared/types/auth-response';

export function usePageAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    retry: false,
    networkMode: 'always',
    mutationFn: async (pageId: string | null) => {
      await queryClient.cancelQueries();
      return switchSession((refreshToken, accessToken) =>
        requestJson(authResponseSchema, {
          method: 'POST',
          url: '/auth/switch',
          skipAuthRefresh: true,
          headers: { Authorization: `Bearer ${accessToken}` },
          data: {
            refreshToken,
            pageId: pageId === null ? null : z.uuid().parse(pageId),
          },
        })
      );
    },
  });
}
