import { fetch as streamFetch } from 'expo/fetch';
import { z } from 'zod';

import { API_BASE_URL } from '@/shared/config/env';
import { refreshSession } from '@/shared/session/session-manager';
import { useSessionStore } from '@/shared/stores/session-store';

import { ApiError } from './api-error';

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

const INVALID_RESPONSE = 'Phản hồi của trợ lý không hợp lệ.';

function parseErrorBody(value: unknown) {
  let payload = value;
  if (typeof value === 'string') {
    try { payload = JSON.parse(value); } catch { payload = null; }
  }
  return errorBodySchema.safeParse(payload);
}

/**
 * Incremental parser for the AI SDK UI-message SSE protocol. Feed it text as it arrives with
 * `push`; `onText` fires with the accumulated answer after every `text-delta`.
 */
export class AiStreamParser {
  private buffer = '';
  private readonly names = new Map<string, string>();
  private readonly tools: AiStreamResult['tools'] = [];
  private text = '';
  private refused = false;
  private sawEvent = false;

  constructor(private readonly onText?: (text: string) => void) {}

  push(chunk: string) {
    this.buffer += chunk;
    let newline = this.buffer.indexOf('\n');
    while (newline !== -1) {
      this.line(this.buffer.slice(0, newline));
      this.buffer = this.buffer.slice(newline + 1);
      newline = this.buffer.indexOf('\n');
    }
  }

  finish(): AiStreamResult {
    if (this.buffer) this.line(this.buffer);
    this.buffer = '';
    if (!this.sawEvent || (!this.text.trim() && this.tools.length === 0)) {
      throw new Error('Trợ lý chưa trả lời được. Vui lòng thử lại.');
    }
    return { text: this.text.trim(), tools: this.tools, refused: this.refused };
  }

  private line(raw: string) {
    const trimmed = raw.replace(/\r$/u, '').trimStart();
    if (!trimmed.startsWith('data:')) return;
    const data = trimmed.slice(5).trim();
    if (!data || data === '[DONE]') return;

    let json: unknown;
    try { json = JSON.parse(data); } catch { throw new Error(INVALID_RESPONSE); }
    const parsed = partSchema.safeParse(json);
    if (!parsed.success) throw new Error(INVALID_RESPONSE);
    const part = parsed.data;
    this.sawEvent = true;

    if (part.type === 'text-delta') {
      const delta = textDeltaSchema.safeParse(part);
      if (!delta.success) throw new Error(INVALID_RESPONSE);
      this.text += delta.data.delta;
      this.onText?.(this.text);
    } else if (part.type === 'tool-input-start' || part.type === 'tool-input-available') {
      const input = toolInputSchema.safeParse(part);
      if (input.success) this.names.set(input.data.toolCallId, input.data.toolName);
    } else if (part.type === 'tool-output-available') {
      const output = toolOutputSchema.safeParse(part);
      if (output.success) {
        this.tools.push({
          name: output.data.toolName ?? this.names.get(output.data.toolCallId) ?? '',
          callId: output.data.toolCallId,
          output: output.data.output,
        });
      }
    } else if (part.type === 'message-metadata') {
      this.refused = this.refused || (typeof part.messageMetadata === 'object'
        && part.messageMetadata !== null
        && 'refused' in part.messageMetadata
        && part.messageMetadata.refused === true);
    } else if (part.type === 'error') {
      const message = typeof part.errorText === 'string' ? part.errorText : 'Trợ lý chưa thể trả lời. Vui lòng thử lại.';
      throw new Error(message);
    }
  }
}

/** Parses a complete SSE body in one go. */
export function parseAiStream(raw: string): AiStreamResult {
  const parser = new AiStreamParser();
  parser.push(raw);
  return parser.finish();
}

export type AiStreamRequest = {
  method?: 'POST';
  /** Path under the API base URL, e.g. `/nutrition-chat`. */
  url: string;
  data: unknown;
  headers?: Record<string, string>;
  /** Guest requests carry their own Bearer token and never refresh the account session. */
  skipAuthRefresh?: boolean;
  timeout?: number;
  signal?: AbortSignal;
  /** Called with the whole answer so far after every streamed chunk of text. */
  onText?: (text: string) => void;
};

function withTimeout(signal: AbortSignal | undefined, timeoutMs: number) {
  const controller = new AbortController();
  const abort = () => controller.abort();
  if (signal?.aborted) controller.abort();
  signal?.addEventListener('abort', abort, { once: true });
  const timer = setTimeout(abort, timeoutMs);
  return {
    signal: controller.signal,
    done: () => {
      clearTimeout(timer);
      signal?.removeEventListener('abort', abort);
    },
  };
}

async function open(request: AiStreamRequest, signal: AbortSignal, token: string | null) {
  const headers: Record<string, string> = {
    Accept: 'text/event-stream',
    'Content-Type': 'application/json',
    ...request.headers,
  };
  if (token && !request.skipAuthRefresh && !headers.Authorization) headers.Authorization = `Bearer ${token}`;
  return streamFetch(`${API_BASE_URL}${request.url}`, {
    method: request.method ?? 'POST',
    headers,
    body: JSON.stringify(request.data),
    signal,
  });
}

/**
 * Streams an AI answer over SSE with the app's session: a 401 refreshes the session and retries
 * once (like the Axios client). Text reaches `onText` as it is generated.
 */
export async function requestAiStream(request: AiStreamRequest): Promise<AiStreamResult> {
  const guard = withTimeout(request.signal, request.timeout ?? 120_000);
  try {
    let sentToken = useSessionStore.getState().accessToken;
    let response = await open(request, guard.signal, sentToken);

    if (response.status === 401 && !request.skipAuthRefresh && useSessionStore.getState().refreshToken) {
      const current = useSessionStore.getState().accessToken;
      const next = current && current !== sentToken ? current : await refreshSession();
      sentToken = next;
      response = await open(request, guard.signal, next);
    }

    if (!response.ok) {
      const body = parseErrorBody(await response.text());
      const message = body.success && body.data.message
        ? [body.data.message].flat().join('; ')
        : 'Không kết nối được trợ lý. Vui lòng thử lại.';
      throw new ApiError(response.status, body.success ? body.data.code : undefined, message);
    }

    const parser = new AiStreamParser(request.onText);
    if (!response.body) {
      parser.push(await response.text());
      return parser.finish();
    }
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      parser.push(decoder.decode(value, { stream: true }));
    }
    return parser.finish();
  } finally {
    guard.done();
  }
}
