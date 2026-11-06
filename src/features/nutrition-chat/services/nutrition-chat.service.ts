import { z } from 'zod';

import { requestAiStream } from '@/shared/api/ai-stream';
import { requestJson } from '@/shared/api/request-json';

import {
  guestSessionSchema,
  nutritionChatRequestSchema,
  type NutritionChatRequest,
} from '../types/nutrition-chat.schema';

type GuestSession = z.output<typeof guestSessionSchema> & { expiresAt: number };

const EXPIRY_LEEWAY_MS = 60_000;
let guestSession: GuestSession | null = null;

/** Keep the short lived guest credential in memory, never in public config or app storage. */
export function getGuestSessionToken() {
  if (!guestSession || guestSession.expiresAt - Date.now() <= EXPIRY_LEEWAY_MS) {
    guestSession = null;
    return null;
  }
  return guestSession.token;
}

export function clearGuestSession() {
  guestSession = null;
}

export async function startGuestSession(turnstileToken: string) {
  if (!turnstileToken.trim()) throw new Error('Thiếu mã xác minh. Vui lòng thử lại.');
  const session = await requestJson(guestSessionSchema, {
    method: 'POST',
    url: '/nutrition-chat/guest-session',
    data: { turnstileToken },
    skipAuthRefresh: true,
  });
  guestSession = { ...session, expiresAt: Date.now() + session.expiresIn * 1000 };
  return session;
}

/**
 * Signed-in users skip the guest check: the API sends them to the account assistant at
 * `/meal-plan/chat`, which uses their session (and refreshes it) instead of a guest token.
 */
export function askAccountAssistant(
  messages: NutritionChatRequest['messages'],
  signal?: AbortSignal,
  onText?: (text: string) => void,
) {
  const body = nutritionChatRequestSchema.parse({ messages });
  return requestAiStream({ method: 'POST', url: '/meal-plan/chat', data: body, timeout: 120_000, signal, onText });
}

/** The backend owns quota and all policy decisions. No local allowance is inferred. */
export async function askNutritionChat(
  messages: NutritionChatRequest['messages'],
  signal?: AbortSignal,
  onText?: (text: string) => void,
) {
  const token = getGuestSessionToken();
  if (!token) throw new Error('Phiên hỏi thử đã hết hạn. Vui lòng xác minh lại.');
  const body = nutritionChatRequestSchema.parse({ messages });
  return requestAiStream({
    method: 'POST',
    url: '/nutrition-chat',
    data: body,
    headers: { Authorization: `Bearer ${token}` },
    skipAuthRefresh: true,
    timeout: 120_000,
    signal,
    onText,
  });
}
