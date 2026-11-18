import { apiClient } from '@/shared/api/api-client';
import { requestJson } from '@/shared/api/request-json';
import { feedPageSchema } from '@/features/feed/types/feed.schema';

import {
  followSuggestionListSchema,
  imageUploadSchema,
  profileEditSchema,
  profilePageSchema,
  profileSchema,
  relationshipSchema,
  usernameSchema,
  type ImageKind,
  type ProfileEdit,
  type ProfileListKind,
} from '../types/profile.schema';

export function getMyProfile(signal?: AbortSignal) {
  return requestJson(profileSchema, { method: 'GET', url: '/profiles/me', signal });
}

export function updateMyProfile(input: ProfileEdit) {
  return requestJson(profileSchema, {
    method: 'PATCH',
    url: '/profiles/me',
    data: profileEditSchema.parse(input),
  });
}

/** The public feed endpoint returns published posts for this author. */
export function getProfilePosts(authorId: string, signal?: AbortSignal, type?: 'POST') {
  return requestJson(feedPageSchema, {
    method: 'GET',
    url: '/posts',
    params: { authorId, limit: 20, ...(type ? { type } : {}) },
    signal,
  });
}

export function getProfile(id: string, signal?: AbortSignal) {
  return requestJson(profileSchema, { method: 'GET', url: `/profiles/${id}`, signal });
}

export function getRelationship(id: string, signal?: AbortSignal) {
  return requestJson(relationshipSchema, { method: 'GET', url: `/profiles/${id}/relationship`, signal });
}

export async function setFollow(id: string, follow: boolean) {
  await apiClient.request({ method: follow ? 'PUT' : 'DELETE', url: `/profiles/${id}/follow` });
}

export function getProfileListPage({ id, kind, cursor, signal }: {
  id: string;
  kind: ProfileListKind;
  cursor: string | null;
  signal?: AbortSignal;
}) {
  return requestJson(profilePageSchema, {
    method: 'GET',
    url: `/profiles/${id}/${kind}`,
    params: cursor ? { cursor } : undefined,
    signal,
  });
}

export function requestImageUpload(kind: ImageKind, contentType: string, sizeBytes: number) {
  return requestJson(imageUploadSchema, {
    method: 'POST',
    url: '/profiles/me/images/uploads',
    data: { kind, contentType, sizeBytes },
  });
}

export function activateImage(uploadId: string) {
  return requestJson(profileSchema, { method: 'POST', url: `/profiles/me/images/${uploadId}/activate` });
}

export function removeImage(kind: ImageKind) {
  return requestJson(profileSchema, { method: 'DELETE', url: `/profiles/me/images/${kind}` });
}

/** Usernames belong to the account, so they change through `/users`, not `/profiles`. */
export async function updateMyUsername(userId: string, username: string) {
  await apiClient.patch(`/users/${userId}`, { username: usernameSchema.parse(username) });
}

export function getSuggestions(limit: number, signal?: AbortSignal) {
  return requestJson(followSuggestionListSchema, {
    method: 'GET',
    url: '/profiles/suggestions',
    params: { limit },
    signal,
  });
}

export async function dismissSuggestion(id: string) {
  await apiClient.delete(`/profiles/suggestions/${id}`);
}
