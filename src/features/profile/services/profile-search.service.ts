import { requestJson } from '@/shared/api/request-json';
import { profileSearchPageSchema } from '../types/profile.schema';

export function searchProfiles(q: string, cursor: string | null, signal?: AbortSignal) {
  return requestJson(profileSearchPageSchema, { method: 'GET', url: '/profiles/search', params: { q: q.trim().slice(0, 200), limit: 20, ...(cursor !== null ? { cursor } : {}) }, signal });
}
