import { requestJson } from '@/shared/api/request-json';

import {
  nutritionInputSchema,
  nutritionProfileSchema,
  weightCheckInSchema,
  type NutritionInput,
  type WeightCheckIn,
} from '../types/nutrition.schema';

export function getNutrition(signal?: AbortSignal) {
  return requestJson(nutritionProfileSchema, { method: 'GET', url: '/dietary/nutrition', signal });
}

export function saveNutrition(values: NutritionInput) {
  return requestJson(nutritionProfileSchema, { method: 'PUT', url: '/dietary/nutrition', data: nutritionInputSchema.parse(values) });
}

export function checkInWeight(values: WeightCheckIn) {
  return requestJson(nutritionProfileSchema, { method: 'POST', url: '/dietary/nutrition/check-in', data: weightCheckInSchema.parse(values) });
}
