import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef, useState } from 'react';

import { ApiError } from '@/shared/api/api-error';
import { useSessionStore } from '@/shared/stores/session-store';

import { blogsKeys } from '../data/blogs.keys';
import { getBlogAiQuota, streamBlogAiChat } from '../services/blog-ai.service';
import {
  EDITOR_TOOL_NAMES,
  MAX_ASSISTANT_MESSAGE_LENGTH,
  MAX_ASSISTANT_SELECTION_LENGTH,
  type AssistantMessage,
  type EditorToolName,
  type EditorToolOutput,
} from '../types/blog-ai.schema';
import { createClientId } from '../utils/ids';

export type EditorContext = {
  title: string;
  content: string;
  /** Selected range in the body (start === end for a plain cursor). */
  range: { start: number; end: number };
};

export type EditorProposal = { callId: string; tool: EditorToolName; input: unknown };

export function assistantErrorText(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 429 && error.code === 'AI_QUOTA_EXCEEDED') return 'Bạn đã dùng hết lượt hôm nay. Lượt mới có từ 0 giờ ngày mai.';
    if (error.status === 429) return 'Bạn gửi hơi nhanh. Hãy thử lại sau ít phút.';
    if (error.status === 503) return 'Trợ lý đang tạm nghỉ. Hãy thử lại sau.';
    if (error.status === 401) return 'Phiên đăng nhập đã hết hạn. Hãy đăng nhập lại.';
    if (error.status === 400) return 'Yêu cầu chưa hợp lệ. Hãy rút ngắn tin nhắn hoặc bắt đầu cuộc trò chuyện mới.';
  }
  if (error instanceof Error) {
    if (error.message === 'RATE_LIMITED') return 'Trợ lý đang quá tải. Hãy thử lại sau ít phút.';
    if (error.message === 'MODEL_ERROR') return 'Trợ lý chưa trả lời được. Hãy thử lại.';
    if (error.name === 'AbortError') return '';
  }
  return 'Chưa kết nối được trợ lý. Hãy kiểm tra mạng rồi thử lại.';
}

const isEditorTool = (name: string): name is EditorToolName => (EDITOR_TOOL_NAMES as string[]).includes(name);
const toolName = (type: string) => type.replace(/^tool-/, '');

function proposalsOf(message: AssistantMessage | undefined): EditorProposal[] {
  if (!message || message.role !== 'assistant') return [];
  return message.parts.flatMap((part) => {
    if (part.type === 'text' || part.state !== 'input-available') return [];
    const name = toolName(part.type);
    return isEditorTool(name) ? [{ callId: part.toolCallId, tool: name, input: part.input }] : [];
  });
}

/**
 * The blog writing assistant: a conversation whose answers may carry editor-tool proposals. Nothing changes in the
 * editor until the user accepts a proposal; once every proposal of an answer has an output, the next turn is sent
 * so the assistant can carry on (several proposals can follow each other).
 */
export function useBlogAssistant({ blogId, getEditor }: { blogId: string | null; getEditor: () => EditorContext }) {
  const token = useSessionStore((state) => state.accessToken);
  const queryClient = useQueryClient();
  const quota = useQuery({ queryKey: blogsKeys.aiQuota, queryFn: ({ signal }) => getBlogAiQuota(signal), enabled: !!token });
  const [messages, setMessages] = useState<AssistantMessage[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const controller = useRef<AbortController | null>(null);
  const selectionAtSend = useRef<{ start: number; end: number; text: string } | null>(null);
  const sendBlogId = useRef(!!blogId);
  const history = useRef<AssistantMessage[]>([]);
  const getEditorRef = useRef(getEditor);

  useEffect(() => {
    getEditorRef.current = getEditor;
  });
  useEffect(() => () => controller.current?.abort(), []);

  const commit = useCallback((next: AssistantMessage[]) => {
    history.current = next;
    setMessages(next);
  }, []);

  /** Streams one answer for `base` (a conversation that ends with a user message or completed tool calls). */
  const runTurn = useCallback(async (base: AssistantMessage[]): Promise<void> => {
    controller.current?.abort();
    const current = new AbortController();
    controller.current = current;
    setBusy(true);
    setError('');
    const assistantId = createClientId();
    const editor = getEditorRef.current();
    const selection = selectionAtSend.current;
    commit([...base, { id: assistantId, role: 'assistant', parts: [] }]);
    try {
      const request = () => streamBlogAiChat({
        messages: base,
        editor: { title: editor.title, content: editor.content, ...(selection?.text ? { selection: selection.text.slice(0, MAX_ASSISTANT_SELECTION_LENGTH) } : {}) },
        blogId: sendBlogId.current ? blogId : null,
        signal: current.signal,
        onParts: (parts) => {
          if (controller.current !== current) return;
          commit([...base, { id: assistantId, role: 'assistant', parts }]);
        },
      });
      let result;
      try {
        result = await request();
      } catch (caught) {
        // The assistant could not read this blog (not saved by this account): ask again without it.
        if (!(caught instanceof ApiError && caught.status === 404 && sendBlogId.current)) throw caught;
        sendBlogId.current = false;
        result = await request();
      }
      if (controller.current !== current) return;
      commit([...base, { id: assistantId, role: 'assistant', parts: result.parts }]);
    } catch (caught) {
      if (controller.current !== current) return;
      commit(base);
      setError(assistantErrorText(caught));
    } finally {
      if (controller.current === current) {
        controller.current = null;
        setBusy(false);
        void queryClient.invalidateQueries({ queryKey: blogsKeys.aiQuota });
      }
    }
  }, [blogId, commit, queryClient]);

  const send = useCallback(async (text: string) => {
    const body = text.trim().slice(0, MAX_ASSISTANT_MESSAGE_LENGTH);
    if (!body || controller.current) return;
    const editor = getEditorRef.current();
    const selected = editor.content.slice(editor.range.start, editor.range.end);
    selectionAtSend.current = selected ? { start: editor.range.start, end: editor.range.end, text: selected } : null;
    await runTurn([...history.current, { id: createClientId(), role: 'user', parts: [{ type: 'text', text: body }] }]);
  }, [runTurn]);

  /** Records the outcome of a proposal; once all of an answer's proposals are resolved the next turn is sent. */
  const resolve = useCallback((callId: string, output: EditorToolOutput) => {
    const list = history.current;
    const last = list.at(-1);
    if (!last || last.role !== 'assistant' || controller.current) return;
    const parts = last.parts.map((part) => (part.type !== 'text' && part.toolCallId === callId
      ? { ...part, state: 'output-available' as const, output }
      : part));
    const next = [...list.slice(0, -1), { ...last, parts }];
    commit(next);
    if (proposalsOf(next.at(-1)).length === 0) void runTurn(next);
  }, [commit, runTurn]);

  /** Sends the conversation again after a failed turn. */
  const retry = useCallback(() => {
    if (controller.current || history.current.length === 0) return;
    void runTurn(history.current);
  }, [runTurn]);

  const reset = useCallback(() => {
    controller.current?.abort();
    controller.current = null;
    selectionAtSend.current = null;
    sendBlogId.current = !!blogId;
    commit([]);
    setBusy(false);
    setError('');
  }, [blogId, commit]);

  const last = messages.at(-1);
  return {
    messages,
    busy,
    error,
    quota: quota.data,
    proposals: proposalsOf(last),
    /** The range that was selected when the last message was sent, for `replaceSelection`. */
    selectionAtSend: () => selectionAtSend.current,
    send,
    resolve,
    retry,
    reset,
    canRetry: !busy && !!error && messages.length > 0,
  };
}
