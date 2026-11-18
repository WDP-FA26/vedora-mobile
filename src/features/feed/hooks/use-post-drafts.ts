import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useSessionStore } from '@/shared/stores/session-store';

import { feedKeys } from '../data/feed.keys';
import { deleteDraft, getDrafts } from '../services/compose.service';

/** Your video drafts; loads only while `enabled` (the composer is open) and refreshes each time. */
export function usePostDrafts(enabled: boolean) {
  const token = useSessionStore((state) => state.accessToken);
  return useQuery({
    queryKey: feedKeys.drafts,
    queryFn: ({ signal }) => getDrafts(signal),
    enabled: !!token && enabled,
    staleTime: 0,
  });
}

export function useDeleteDraft() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteDraft,
    onSettled: () => queryClient.invalidateQueries({ queryKey: feedKeys.drafts }),
  });
}
