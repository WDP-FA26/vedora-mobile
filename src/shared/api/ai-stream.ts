import { AxiosHeaders, type AxiosRequestConfig } from 'axios';
import { z } from 'zod';

import { ApiError } from './api-error';
import { apiClient } from './api-client';

export type AiStreamResult = {
  text: string;
  tools: { name: string; callId: string; output: unknown }[];
  refused: boolean;
};

const partSchema = z.object({ type: z.string() }).passthrough();
const textDeltaSchema = z.object({ type: z.literal('text-delta'), delta: z.string() });
const toolInputSchema = z.object({
  type: z.union([z.literal('tool-input-start'), z.literal('tool-input-available')]),
  toolCallId: z.string(),
  toolName: z.string(),
});
const toolOutputSchema = z.object({
  type: z.literal('tool-output-available'),
  toolCallId: z.string(),
  toolName: z.string().optional(),
  output: z.unknown(),
});
const errorBodySchema = z.object({
  code: z.string().optional(),
  message: z.union([z.string(), z.array(z.string())]).optional(),
}).passthrough();

function parseErrorBody(value: unknown) {
  let payload = value;
  if (typeof value === 'string') {
    try { payload = JSON.parse(value); } catch { payload = null; }
  }
  return errorBodySchema.safeParse(payload);
}

/** Parses the AI SDK UI-message SSE protocol after a mobile-safe Axios request completes. */
export function parseAiStream(raw: string): AiStreamResult {
  const names = new Map<string, string>();
  const tools: AiStreamResult['tools'] = [];
  let text = '';
  let refused = false;
  let sawEvent = false;

  for (const line of raw.split(/\r?\n/u)) {
    const trimmed = line.trimStart();
    if (!trimmed.startsWith('data:')) continue;
    const data = trimmed.slice(5).trim();
    if (!data || data === '[DONE]') continue;

    let json: unknown;
    try { json = JSON.parse(data); } catch { throw new Error('Phản hồi của trợ lý không hợp lệ.'); }
    const parsed = partSchema.safeParse(json);
    if (!parsed.success) throw new Error('Phản hồi của trợ lý không hợp lệ.');
    const part = parsed.data;
    sawEvent = true;

    if (part.type === 'text-delta') {
      const delta = textDeltaSchema.safeParse(part);
      if (!delta.success) throw new Error('Phản hồi của trợ lý không hợp lệ.');
      text += delta.data.delta;
    } else if (part.type === 'tool-input-start' || part.type === 'tool-input-available') {
      const input = toolInputSchema.safeParse(part);
      if (input.success) names.set(input.data.toolCallId, input.data.toolName);
    } else if (part.type === 'tool-output-available') {
      const output = toolOutputSchema.safeParse(part);
      if (output.success) {
        tools.push({
          name: output.data.toolName ?? names.get(output.data.toolCallId) ?? '',
          callId: output.data.toolCallId,
          output: output.data.output,
        });
      }
    } else if (part.type === 'message-metadata') {
      refused = refused || (typeof part.messageMetadata === 'object'
        && part.messageMetadata !== null
        && 'refused' in part.messageMetadata
        && part.messageMetadata.refused === true);
    } else if (part.type === 'error') {
      const message = typeof part.errorText === 'string' ? part.errorText : 'Trợ lý chưa thể trả lời. Vui lòng thử lại.';
      throw new Error(message);
    }
  }

  if (!sawEvent || (!text.trim() && tools.length === 0)) {
    throw new Error('Trợ lý chưa trả lời được. Vui lòng thử lại.');
  }
  return { text: text.trim(), tools, refused };
}

/** Uses the existing authenticated API client; response is SSE text, not JSON. */
export async function requestAiStream(config: AxiosRequestConfig): Promise<AiStreamResult> {
  const headers = AxiosHeaders.from(config.headers as Record<string, string> | undefined);
  headers.set('Accept', 'text/event-stream');
  const response = await apiClient.request<unknown>({
    ...config,
    headers,
    responseType: 'text',
    timeout: config.timeout ?? 120_000,
    // Keep 401 in the normal auth-refresh path. Parse other error bodies for quota codes.
    validateStatus: (status) => status !== 401,
  });

  if (response.status < 200 || response.status >= 300) {
    const body = parseErrorBody(response.data);
    const message = body.success && body.data.message
      ? [body.data.message].flat().join('; ')
      : 'Không kết nối được trợ lý. Vui lòng thử lại.';
    throw new ApiError(response.status, body.success ? body.data.code : undefined, message);
  }
  if (typeof response.data !== 'string') throw new Error('Phản hồi của trợ lý không hợp lệ.');
  return parseAiStream(response.data);
}
