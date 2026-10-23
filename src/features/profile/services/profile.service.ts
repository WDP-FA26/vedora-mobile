import { apiClient } from '@/shared/api/api-client';
import { requestJson } from '@/shared/api/request-json';
import { feedPageSchema } from '@/features/feed/types/feed.schema';

import {
  profileEditSchema,
  profilePageSchema,
  profileSchema,
  relationshipSchema,
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
