import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { feedKeys } from '@/features/feed/data/feed.keys';
import { useSessionStore } from '@/shared/stores/session-store';

import { profileKeys } from '../data/profile.keys';
import { ApiError } from '@/shared/api/api-error';

import { activateImage, dismissSuggestion, getMyProfile, getProfile, getSuggestions, getProfileListPage, getProfilePosts, getRelationship, removeImage, requestImageUpload, setFollow, updateMyProfile, updateMyUsername, uploadImageToStorage } from '../services/profile.service';
import { IMAGE_CONTENT_TYPES, MAX_IMAGE_MB, type FollowSuggestionList, type ImageKind, type Profile, type ProfileListKind } from '../types/profile.schema';

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

const ACTIVATE_ATTEMPTS = 6;
const ACTIVATE_FIRST_RETRY_MS = 250;

/** Storage confirms an upload a moment after the PUT, so activation retries on 409. */
async function activateWhenConfirmed(uploadId: string) {
  for (let attempt = 1; ; attempt++) {
    try {
      return await activateImage(uploadId);
    } catch (error) {
      if (!(error instanceof ApiError && error.status === 409) || attempt === ACTIVATE_ATTEMPTS) throw error;
      await new Promise((resolve) => setTimeout(resolve, ACTIVATE_FIRST_RETRY_MS * 2 ** (attempt - 1)));
    }
  }
}

export type PickedImage = { uri: string; contentType: string; sizeBytes: number; file?: globalThis.File };

function imageFailure(error: unknown) {
  if (error instanceof ApiError && error.status === 415) return 'Ảnh phải là JPEG, PNG hoặc WebP.';
  if (error instanceof ApiError && error.status === 413) return 'Ảnh quá lớn. Chọn ảnh nhỏ hơn nhé.';
  return 'Không cập nhật được ảnh. Thử lại nhé.';
}

/** Change or remove the avatar/cover: request target → PUT to storage → activate. */
export function useProfileImage() {
  const queryClient = useQueryClient();
  const apply = (profile: Profile) => {
    queryClient.setQueryData(profileKeys.me, profile);
    queryClient.setQueryData(profileKeys.detail(profile.id), profile);
    void queryClient.invalidateQueries({ queryKey: feedKeys.all });
  };
  const upload = useMutation({
    mutationFn: async ({ kind, image }: { kind: ImageKind; image: PickedImage }) => {
      if (!IMAGE_CONTENT_TYPES.includes(image.contentType)) throw new ImageError('Ảnh phải là JPEG, PNG hoặc WebP.');
      if (image.sizeBytes > MAX_IMAGE_MB[kind] * 1024 * 1024) throw new ImageError(`Ảnh lớn hơn ${MAX_IMAGE_MB[kind]} MB. Chọn ảnh nhỏ hơn nhé.`);
      const target = await requestImageUpload(kind, image.contentType, image.sizeBytes);
      await uploadImageToStorage(target.upload, image, image.contentType);
      return activateWhenConfirmed(target.id);
    },
    onSuccess: apply,
  });
  const remove = useMutation({ mutationFn: removeImage, onSuccess: apply });
  const error = upload.error ?? remove.error;
  return {
    upload,
    remove,
    pending: upload.isPending || remove.isPending,
    errorMessage: error ? (error instanceof ImageError ? error.message : imageFailure(error)) : null,
  };
}

class ImageError extends Error {}

export function useChangeUsername() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, username }: { userId: string; username: string }) => updateMyUsername(userId, username),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: profileKeys.me });
      void queryClient.invalidateQueries({ queryKey: feedKeys.all });
    },
  });
}

/** "Who to follow" for the signed-in user. Follow and dismiss drop the person from the list at once. */
export function useSuggestions(limit: number) {
  const queryClient = useQueryClient();
  const token = useSessionStore((state) => state.accessToken);
  const key = profileKeys.suggestions(limit);
  const query = useQuery({
    queryKey: key,
    queryFn: ({ signal }) => getSuggestions(limit, signal),
    enabled: !!token,
  });
  const drop = useMutation({
    mutationFn: ({ id, follow }: { id: string; follow: boolean }) => (follow ? setFollow(id, true) : dismissSuggestion(id)),
    onMutate: async ({ id }) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<FollowSuggestionList>(key);
      queryClient.setQueryData<FollowSuggestionList>(key, (list) => list && { items: list.items.filter((item) => item.id !== id) });
      return { previous };
    },
    onError: (_error, _vars, context) => queryClient.setQueryData(key, context?.previous),
    onSuccess: (_data, { id, follow }) => {
      if (!follow) return;
      void queryClient.invalidateQueries({ queryKey: profileKeys.relationship(id) });
      void queryClient.invalidateQueries({ queryKey: profileKeys.detail(id) });
      void queryClient.invalidateQueries({ queryKey: profileKeys.me });
      void queryClient.invalidateQueries({ queryKey: ['following'] });
    },
  });
  return { ...query, follow: (id: string) => drop.mutate({ id, follow: true }), dismiss: (id: string) => drop.mutate({ id, follow: false }), failed: drop.isError };
}
