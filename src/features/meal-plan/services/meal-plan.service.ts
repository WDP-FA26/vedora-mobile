import { apiClient } from '@/shared/api/api-client';
import { requestJson } from '@/shared/api/request-json';
import { requestAiStream, type AiPart } from '@/shared/api/ai-stream';

import {
  dietaryRestrictionsSchema,
  mealDayInputSchema,
  mealPlanSchema,
  plannerThreadPageSchema,
  plannerThreadSchema,
  weekStartSchema,
  type MealDayInput,
  type PlannerThread,
} from '../types/meal-plan.schema';

export function getMealPlan(weekStart?: string, signal?: AbortSignal) {
  return requestJson(mealPlanSchema, { method: 'GET', url: '/meal-plan', params: weekStart ? { weekStart: weekStartSchema.parse(weekStart) } : undefined, signal });
}

export function getDietaryRestrictions(signal?: AbortSignal) {
  return requestJson(dietaryRestrictionsSchema, { method: 'GET', url: '/dietary/me', signal });
}

export function saveMealDays(weekStart: string, days: MealDayInput[]) {
  const payload = { weekStart: weekStartSchema.parse(weekStart), days: mealDayInputSchema.array().parse(days) };
  return requestJson(mealPlanSchema, { method: 'PUT', url: '/meal-plan/days', data: payload });
}

/** Streams an answer; the API saves the question and the answer into thread `threadId` (created on first use). */
export function askMealPlanner(weekStart: string, threadId: string, messages: { role: 'user' | 'assistant'; text: string }[], onParts?: (parts: AiPart[]) => void) {
  return requestAiStream({ method: 'POST', url: '/meal-plan/chat', data: { weekStart: weekStartSchema.parse(weekStart), threadId, messages: messages.slice(-10) }, onParts });
}

export async function discardPlannerDraft(weekStart: string) {
  await apiClient.delete('/meal-plan/draft', { params: { weekStart: weekStartSchema.parse(weekStart) } });
}

/** One page of saved conversations, most recently used first. */
export function getPlannerThreads({ page, limit = 20, signal }: { page: number; limit?: number; signal?: AbortSignal }) {
  return requestJson(plannerThreadPageSchema, { method: 'GET', url: '/meal-plan/chat/threads', params: { page, limit }, signal });
}

/** A saved conversation with all its messages. */
export function getPlannerThread(threadId: string, signal?: AbortSignal) {
  return requestJson(plannerThreadSchema, { method: 'GET', url: `/meal-plan/chat/threads/${threadId}`, signal });
}

/** The most recently used saved conversation with all its messages, or null when there is none yet. */
export async function getLatestPlannerThread(signal?: AbortSignal): Promise<PlannerThread | null> {
  const id = (await getPlannerThreads({ page: 1, limit: 1, signal })).items[0]?.id;
  return id ? getPlannerThread(id, signal) : null;
}

export async function deletePlannerThread(threadId: string) {
  await apiClient.delete(`/meal-plan/chat/threads/${threadId}`);
}

/** Merges these proposal statuses into the saved thread (other proposals keep theirs). */
export async function savePlannerStatuses(threadId: string, proposalStatuses: PlannerThread['proposalStatuses']) {
  await apiClient.patch(`/meal-plan/chat/threads/${threadId}`, { proposalStatuses });
}
