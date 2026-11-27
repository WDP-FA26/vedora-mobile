import { z } from 'zod';
import { weekdays, weekStartSchema } from './meal-plan.schema';

export const VOICE_MAX_SECONDS = 300;
export const voiceSessionSchema = z.object({
  token: z.string().min(1), url: z.url().refine((url) => url.startsWith('wss://')), expiresAt: z.number().nullable(), model: z.string(),
});
export const voiceFocusSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('recipe'), recipeId: z.string().min(1), title: z.string(), section: z.enum(['top', 'ingredients', 'steps']).nullable(), step: z.number().int().min(1).max(50).nullable().optional() }),
  z.object({ kind: z.literal('eatingLog'), date: z.iso.date().nullable() }),
  z.object({ kind: z.literal('bodyMetrics') }),
  z.object({ kind: z.literal('planDay'), weekStart: weekStartSchema, day: z.enum(weekdays).nullable() }),
]);
export const voiceScreenCommandSchema = z.object({
  focus: voiceFocusSchema.nullable(), close: z.enum(['recipe', 'eatingLog', 'bodyMetrics', 'all']).nullable(),
  scroll: z.enum(['up', 'down', 'top', 'bottom']).nullable().optional(),
});
export const voiceRefreshSchema = z.object({ plan: z.boolean().optional(), log: z.boolean().optional(), nutrition: z.boolean().optional(), dietary: z.boolean().optional() });
export const voiceScreenSchema = z.object({
  weekStart: weekStartSchema, day: z.enum(weekdays).optional(), panel: z.enum(['none', 'recipe', 'eatingLog', 'bodyMetrics']),
  recipeId: z.string().optional(), recipeSection: z.enum(['top', 'ingredients', 'steps']).optional(), recipeStep: z.number().int().min(1).max(50).optional(),
  eatingLogDate: z.iso.date().optional(), scrollState: z.object({ percent: z.number().int().min(0).max(100), atTop: z.boolean(), atBottom: z.boolean() }).optional(),
});
export const voiceTurnSchema = z.object({ weekStart: weekStartSchema, threadId: z.uuidv4(), requestId: z.string().min(1).max(100), message: z.string().trim().min(1).max(4000), screen: voiceScreenSchema });
export type VoiceFocus = z.infer<typeof voiceFocusSchema>;
export type VoiceScreen = z.infer<typeof voiceScreenSchema>;
export type VoiceScreenCommand = z.infer<typeof voiceScreenCommandSchema>;
export type VoiceRefresh = z.infer<typeof voiceRefreshSchema>;
export type VoiceSession = z.infer<typeof voiceSessionSchema>;
export const realtimeEventSchema = z.object({ type: z.string() }).passthrough();
export const transcriptSchema = z.object({ speaker: z.enum(['user', 'assistant']), delta: z.string(), startMs: z.number(), endMs: z.number() });
export const delegationSchema = z.object({ delegationId: z.string().min(1).max(100), offsetMs: z.number().optional() });
