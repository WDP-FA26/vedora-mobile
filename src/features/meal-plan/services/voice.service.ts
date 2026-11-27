import { requestJson } from '@/shared/api/request-json';
import { requestAiStream } from '@/shared/api/ai-stream';
import { voiceSessionSchema, voiceTurnSchema } from '../types/voice.schema';
import type { z } from 'zod';

export function createVoiceSession(threadId: string, signal: AbortSignal) {
  return requestJson(voiceSessionSchema, { method: 'POST', url: '/meal-plan/voice/session', data: { threadId }, signal });
}

export function sendVoiceTurn(input: z.infer<typeof voiceTurnSchema>, signal: AbortSignal, onEvent: NonNullable<Parameters<typeof requestAiStream>[0]['onEvent']>) {
  return requestAiStream({ url: '/meal-plan/voice/turns', data: voiceTurnSchema.parse(input), signal, onEvent, allowEmpty: true });
}
