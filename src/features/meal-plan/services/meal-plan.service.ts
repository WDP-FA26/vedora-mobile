import { apiClient } from '@/shared/api/api-client';
import { requestJson } from '@/shared/api/request-json';
import { requestAiStream } from '@/shared/api/ai-stream';

import {
  dietaryRestrictionsSchema,
  mealDayInputSchema,
  mealPlanSchema,
  plannerThreadPageSchema,
  plannerThreadSchema,
  type MealDayInput,
  type PlannerThread,
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

/** Streams an answer; the API saves the question and the answer into thread `threadId` (created on first use). */
export function askMealPlanner(threadId: string, messages: { role: 'user' | 'assistant'; text: string }[], onText?: (text: string) => void) {
  return requestAiStream({ method: 'POST', url: '/meal-plan/chat', data: { threadId, messages: messages.slice(-10) }, onText });
}

/** The most recently used saved conversation with all its messages, or null when there is none yet. */
export async function getLatestPlannerThread(signal?: AbortSignal): Promise<PlannerThread | null> {
  const page = await requestJson(plannerThreadPageSchema, { method: 'GET', url: '/meal-plan/chat/threads', params: { limit: 1 }, signal });
  const id = page.items[0]?.id;
  return id ? requestJson(plannerThreadSchema, { method: 'GET', url: `/meal-plan/chat/threads/${id}`, signal }) : null;
}

/** Merges these proposal statuses into the saved thread (other proposals keep theirs). */
export async function savePlannerStatuses(threadId: string, proposalStatuses: PlannerThread['proposalStatuses']) {
  await apiClient.patch(`/meal-plan/chat/threads/${threadId}`, { proposalStatuses });
}
