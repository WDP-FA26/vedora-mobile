import { requestJson } from '@/shared/api/request-json';
import { requestAiStream } from '@/shared/api/ai-stream';

import {
  dietaryRestrictionsSchema,
  mealDayInputSchema,
  mealPlanSchema,
  type MealDayInput,
} from '../types/meal-plan.schema';

export function getMealPlan(signal?: AbortSignal) {
  return requestJson(mealPlanSchema, { method: 'GET', url: '/meal-plan', signal });
}

export function getDietaryRestrictions(signal?: AbortSignal) {
  return requestJson(dietaryRestrictionsSchema, { method: 'GET', url: '/dietary/me', signal });
}

export function saveMealDays(days: MealDayInput[]) {
  const payload = { days: mealDayInputSchema.array().parse(days) };
  return requestJson(mealPlanSchema, { method: 'PUT', url: '/meal-plan/days', data: payload });
}

export function askMealPlanner(messages: { role: 'user' | 'assistant'; text: string }[], onText?: (text: string) => void) {
  return requestAiStream({ method: 'POST', url: '/meal-plan/chat', data: { messages: messages.slice(-10) }, onText });
}
