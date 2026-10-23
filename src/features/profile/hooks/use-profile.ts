import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { feedKeys } from '@/features/feed/data/feed.keys';
import { useSessionStore } from '@/shared/stores/session-store';

import { profileKeys } from '../data/profile.keys';
import { getMyProfile, getProfile, getProfileListPage, getProfilePosts, getRelationship, setFollow, updateMyProfile } from '../services/profile.service';
import type { Profile, ProfileListKind } from '../types/profile.schema';

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

export function useProfile(id: string) {
  return useQuery({
    queryKey: profileKeys.detail(id),
    queryFn: ({ signal }) => getProfile(id, signal),
  });
}

/** Public posts of any author; guests may read them. */
export function useAuthorPosts(id: string) {
  return useQuery({
    queryKey: profileKeys.posts(id),
    queryFn: ({ signal }) => getProfilePosts(id, signal),
  });
}

export function useRelationship(id: string, session: string | null) {
  return useQuery({
    queryKey: profileKeys.relationship(id),
    queryFn: ({ signal }) => getRelationship(id, signal),
    enabled: !!session,
  });
}

/** Optimistic follow toggle: updates the button and follower count at once, rolls back on error. */
export function useFollow(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (follow: boolean) => setFollow(id, follow),
    onMutate: async (follow) => {
      await queryClient.cancelQueries({ queryKey: profileKeys.relationship(id) });
      const relationship = queryClient.getQueryData<{ isFollowing: boolean }>(profileKeys.relationship(id));
      const profile = queryClient.getQueryData<Profile>(profileKeys.detail(id));
      queryClient.setQueryData(profileKeys.relationship(id), { isFollowing: follow });
      if (profile && relationship && relationship.isFollowing !== follow) {
        queryClient.setQueryData<Profile>(profileKeys.detail(id), {
          ...profile,
          followerCount: Math.max(0, profile.followerCount + (follow ? 1 : -1)),
        });
      }
      return { relationship, profile };
    },
    onError: (_error, _follow, context) => {
      queryClient.setQueryData(profileKeys.relationship(id), context?.relationship);
      queryClient.setQueryData(profileKeys.detail(id), context?.profile);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: profileKeys.relationship(id) });
      void queryClient.invalidateQueries({ queryKey: profileKeys.detail(id) });
      void queryClient.invalidateQueries({ queryKey: profileKeys.me });
      void queryClient.invalidateQueries({ queryKey: ['following'] });
      void queryClient.invalidateQueries({ queryKey: profileKeys.all, predicate: (query) => query.queryKey[1] === 'followers' || query.queryKey[1] === 'following' });
    },
  });
}

export function useProfileList(id: string, kind: ProfileListKind) {
  return useInfiniteQuery({
    queryKey: kind === 'followers' ? profileKeys.followers(id) : profileKeys.following(id),
    initialPageParam: null as string | null,
    queryFn: ({ pageParam, signal }) => getProfileListPage({ id, kind, cursor: pageParam, signal }),
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });
}
