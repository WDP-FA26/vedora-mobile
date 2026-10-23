import { requestJson } from '@/shared/api/request-json';

import { dietaryOptionsSchema, dietaryRestrictionsSchema, dietaryUpdateSchema, type DietaryUpdate } from '../types/dietary-profile.schema';

export function getDietaryOptions(signal?: AbortSignal) {
  return requestJson(dietaryOptionsSchema, { method: 'GET', url: '/dietary/options', signal });
}

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
