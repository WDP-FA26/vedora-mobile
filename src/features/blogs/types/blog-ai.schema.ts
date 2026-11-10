import { z } from 'zod';

export const MAX_ASSISTANT_MESSAGE_LENGTH = 4000;
export const MAX_ASSISTANT_SELECTION_LENGTH = 4000;
/** The API accepts at most 40 UI messages; the oldest whole messages are dropped first. */
export const MAX_ASSISTANT_MESSAGES = 40;

const position = z.enum(['cursor', 'end', 'after']);

/** Editor tools run in the app: the assistant proposes, the user accepts or rejects each change. */
export const editorToolSchemas = {
  replaceSelection: z.object({ markdown: z.string() }),
  replaceText: z.object({ find: z.string().min(1), replace: z.string() }),
  insertMarkdown: z.object({ markdown: z.string(), position, after: z.string().optional() }),
  setTitle: z.object({ title: z.string() }),
  insertImage: z.object({
    url: z.string(),
    alt: z.string().default(''),
    position,
    after: z.string().optional(),
    replaces: z.string().optional(),
  }),
} as const;

export type EditorToolName = keyof typeof editorToolSchemas;
export const EDITOR_TOOL_NAMES = Object.keys(editorToolSchemas) as EditorToolName[];

export type EditorToolOutput = {
  applied: boolean;
  error?: 'NO_SELECTION' | 'NOT_FOUND' | 'AMBIGUOUS' | 'STALE';
  /** Up to 500 characters: the user's reason for rejecting, or why a change could not be applied. */
  reason?: string;
};

export const quotaUsageSchema = z.object({
  feature: z.string(),
  used: z.number().int().nonnegative(),
  limit: z.number().int().nonnegative(),
  resetsAt: z.string(),
});
export const blogAiQuotaSchema = z.object({
  messages: quotaUsageSchema,
  images: quotaUsageSchema,
});
export type BlogAiQuota = z.output<typeof blogAiQuotaSchema>;

/** A message in the AI SDK UI-message shape that `POST /blogs/ai/chat` expects. */
export type AssistantMessage = {
  id: string;
  role: 'user' | 'assistant';
  parts: (
    | { type: 'text'; text: string }
    | { type: `tool-${string}`; toolCallId: string; state: 'input-available' | 'output-available'; input: unknown; output?: unknown }
  )[];
};
