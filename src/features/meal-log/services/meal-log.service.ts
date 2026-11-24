import { apiClient } from '@/shared/api/api-client';
import { requestJson } from '@/shared/api/request-json';

import {
  calorieEstimateSchema,
  mealLogEntrySchema,
  mealLogWeekSchema,
  newMealLogEntrySchema,
  type NewMealLogEntry,
} from '../types/meal-log.schema';

/** The week starting `weekStart` (a Monday), or the current week when omitted. */
export function getMealLog(weekStart?: string, signal?: AbortSignal) {
  return requestJson(mealLogWeekSchema, { method: 'GET', url: '/meal-plan/log', params: weekStart ? { weekStart } : undefined, signal });
}

export function createMealLogEntry(entry: NewMealLogEntry) {
  return requestJson(mealLogEntrySchema, { method: 'POST', url: '/meal-plan/log', data: newMealLogEntrySchema.parse(entry) });
}

export async function deleteMealLogEntry(id: string) {
  await apiClient.delete(`/meal-plan/log/${id}`);
}

/** Asks the AI to look the dish up on the web; nothing is saved. Can take up to ~50 s, so pass a signal. */
export function estimateCalories(question: { name: string; details?: string }, signal?: AbortSignal) {
  return requestJson(calorieEstimateSchema, { method: 'POST', url: '/meal-plan/log/calorie-estimate', data: question, signal, timeout: 60_000 });
}
