import { requestAiStream, type AiPart } from '@/shared/api/ai-stream';
import { requestJson } from '@/shared/api/request-json';

import { blogAiQuotaSchema, MAX_ASSISTANT_MESSAGES, type AssistantMessage } from '../types/blog-ai.schema';

export function getBlogAiQuota(signal?: AbortSignal) {
  return requestJson(blogAiQuotaSchema, { method: 'GET', url: '/blogs/ai/quota', signal });
}

export type EditorSnapshot = {
  title: string;
  content: string;
  /** The text selected when the request was sent; omitted when nothing was selected. */
  selection?: string;
};

/**
 * One turn of `POST /blogs/ai/chat`. The whole conversation goes up each time (the API keeps nothing), with the
 * editor as it is right now. The stream stops at an editor tool call until the app sends the tool's output back.
 */
export function streamBlogAiChat({ messages, editor, blogId, signal, onParts }: {
  messages: AssistantMessage[];
  editor: EditorSnapshot;
  blogId?: string | null;
  signal?: AbortSignal;
  onParts?: (parts: AiPart[]) => void;
}) {
  return requestAiStream({
    method: 'POST',
    url: '/blogs/ai/chat',
    data: {
      messages: messages.slice(-MAX_ASSISTANT_MESSAGES),
      editor: {
        title: editor.title,
        content: editor.content,
        ...(editor.selection ? { selection: editor.selection } : {}),
      },
      ...(blogId ? { blogId } : {}),
    },
    timeout: 180_000,
    signal,
    onParts,
  });
}
