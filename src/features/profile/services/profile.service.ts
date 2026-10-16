import { requestJson } from '@/shared/api/request-json';
import { feedPageSchema } from '@/features/feed/types/feed.schema';

import { profileEditSchema, profileSchema, type ProfileEdit } from '../types/profile.schema';

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
