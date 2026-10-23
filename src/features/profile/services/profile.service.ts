import { File, UploadType } from 'expo-file-system';
import { Platform } from 'react-native';

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
  type ImageUploadTarget,
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
export function getProfilePosts(authorId: string, signal?: AbortSignal) {
  return requestJson(feedPageSchema, {
    method: 'GET',
    url: '/posts',
    params: { authorId, limit: 20 },
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

/** PUTs the picked image straight to storage with the presigned headers, never through the API client. */
export async function uploadImageToStorage(
  upload: ImageUploadTarget['upload'],
  image: { uri: string; file?: globalThis.File },
  contentType: string,
) {
  const headers = { ...upload.headers, 'Content-Type': upload.headers['Content-Type'] ?? contentType };
  if (Platform.OS === 'web') {
    if (!image.file) throw new Error('Không đọc được ảnh đã chọn.');
    const response = await fetch(upload.url, { method: 'PUT', headers, body: image.file });
    if (!response.ok) throw new Error(`Tải ảnh lên thất bại (HTTP ${response.status}).`);
    return;
  }
  const file = new File(image.uri);
  if (!file.exists || file.size === 0) throw new Error('Không đọc được ảnh đã chọn.');
  const task = file.createUploadTask(upload.url, {
    httpMethod: 'PUT',
    uploadType: UploadType.BINARY_CONTENT,
    mimeType: contentType,
    headers,
  });
  try {
    const result = await task.uploadAsync();
    if (result.status < 200 || result.status >= 300) throw new Error(`Tải ảnh lên thất bại (HTTP ${result.status}).`);
  } finally {
    task.release();
  }
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
