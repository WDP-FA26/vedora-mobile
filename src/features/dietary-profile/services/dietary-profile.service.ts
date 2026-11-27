import { requestJson } from '@/shared/api/request-json';

import { dietaryRestrictionsSchema, dietaryUpdateSchema, type DietaryUpdate } from '../types/dietary-profile.schema';

export function getMyDietary(signal?: AbortSignal) {
  return requestJson(dietaryRestrictionsSchema, { method: 'GET', url: '/dietary/me', signal });
}

export function saveMyDietary(values: DietaryUpdate) {
  return requestJson(dietaryRestrictionsSchema, {
    method: 'PUT',
    url: '/dietary/me',
    data: dietaryUpdateSchema.parse(values),
  });
}
