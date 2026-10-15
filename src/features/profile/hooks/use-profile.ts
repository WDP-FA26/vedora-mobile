import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { feedKeys } from '@/features/feed/data/feed.keys';
import { useSessionStore } from '@/shared/stores/session-store';

import { profileKeys } from '../data/profile.keys';
import { getMyProfile, getProfilePosts, updateMyProfile } from '../services/profile.service';

export function useMyProfile(session: string | null) {
  return useQuery({
    queryKey: profileKeys.me,
    queryFn: ({ signal }) => getMyProfile(signal),
    enabled: !!session,
  });
}

export function useProfilePosts(authorId: string | undefined, session: string | null) {
  return useQuery({
    queryKey: profileKeys.posts(authorId ?? ''),
    queryFn: ({ signal }) => getProfilePosts(authorId!, signal),
    enabled: !!session && !!authorId,
  });
}

export function useUpdateMyProfile(session: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateMyProfile,
    onSuccess: (profile) => {
      if (session && useSessionStore.getState().accessToken === session) {
        queryClient.setQueryData(profileKeys.me, profile);
        void queryClient.invalidateQueries({ queryKey: feedKeys.all });
        void queryClient.invalidateQueries({ queryKey: profileKeys.posts(profile.id) });
      }
    },
  });
}
