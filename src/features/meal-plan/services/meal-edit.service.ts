import { requestJson } from '@/shared/api/request-json';

import { generatedMealsSchema, generateMealsSchema, mealPlanSchema, saveMealDaysSchema, type GenerateMeals, type SaveMealDays } from '../types/meal-edit.schema';

export function saveMealDays(input: SaveMealDays, signal?: AbortSignal) {
  return requestJson(mealPlanSchema, { method: 'PUT', url: '/meal-plan/days', data: saveMealDaysSchema.parse(input), signal });
}
export function generateMeals(input: GenerateMeals, signal?: AbortSignal) {
  return requestJson(generatedMealsSchema, { method: 'POST', url: '/meal-plan/generate', data: generateMealsSchema.parse(input), signal });
}
