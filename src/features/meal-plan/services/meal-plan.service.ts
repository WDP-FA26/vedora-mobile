import { apiClient } from '@/shared/api/api-client';
import { ApiError } from '@/shared/api/api-error';
import { requestJson } from '@/shared/api/request-json';
import { requestAiStream, type AiPart } from '@/shared/api/ai-stream';

import {
  dietaryRestrictionsSchema,
  mealPlanSchema,
  plannerThreadPageSchema,
  plannerThreadSchema,
  plannerRewindSchema,
  plannerAnswerSchema,
  plannerWebDecisionSchema,
  weekStartSchema,
  type PlannerThread,
} from '../types/meal-plan.schema';

export function getMealPlan(weekStart?: string, signal?: AbortSignal) {
  return requestJson(mealPlanSchema, { method: 'GET', url: '/meal-plan', params: weekStart ? { weekStart: weekStartSchema.parse(weekStart) } : undefined, signal });
}

export function getDietaryRestrictions(signal?: AbortSignal) {
  return requestJson(dietaryRestrictionsSchema, { method: 'GET', url: '/dietary/me', signal });
}

/** Streams an answer; the API saves the question and the answer into thread `threadId` (created on first use). */
export function askMealPlanner(weekStart: string, threadId: string, requestId: string, messages: { role: 'user' | 'assistant'; text: string }[], onParts?: (parts: AiPart[]) => void, signal?: AbortSignal, allowWebSearch = false) {
  return requestAiStream({ method: 'POST', url: '/meal-plan/chat', data: { weekStart: weekStartSchema.parse(weekStart), threadId, requestId, allowWebSearch, messages: messages.slice(-40) }, onParts, signal });
}

/** Patch the server's message ID, not the temporary ID used while streaming. */
export async function answerPlannerTool(threadId: string, callId: string, output: { answer: string } | { approved: boolean }, signal?: AbortSignal) {
  const thread = await getPlannerThread(threadId, signal);
  const message = thread.messages.find((item) => item.role === 'assistant' && item.parts.some((part) => part.toolCallId === callId));
  if (!message || message !== thread.messages.at(-1)) throw new ApiError(409, 'PLANNER_MESSAGE_NOT_SAVED', 'Message not saved or no longer current');
  const decision = 'approved' in output ? plannerWebDecisionSchema.parse(output) : plannerAnswerSchema.parse(output);
  const type = 'approved' in decision ? 'tool-requestWebSearch' : 'tool-askUser';
  if (!message.parts.some((part) => part.toolCallId === callId && part.type === type)) throw new ApiError(409, 'PLANNER_REQUEST_CHANGED', 'Request changed');
  const parts = message.parts.map((part) => part.toolCallId === callId ? { ...part, state: 'output-available', output: decision } : part);
  return requestJson(plannerThreadSchema, {
    method: 'PATCH', url: `/meal-plan/chat/threads/${threadId}`, signal,
    data: { messages: [{ ...message, parts }] },
  });
}

export function rewindPlannerThread(threadId: string, messageId: string, signal?: AbortSignal) {
  return requestJson(plannerRewindSchema, {
    method: 'POST', url: `/meal-plan/chat/threads/${threadId}/rewind`, data: { messageId }, signal,
  });
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
