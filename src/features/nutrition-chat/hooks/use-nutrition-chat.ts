import { useCallback, useRef, useState } from 'react';

import { ApiError } from '@/shared/api/api-error';
import { useSessionStore } from '@/shared/stores/session-store';

import { askAccountAssistant, askNutritionChat, clearGuestSession, getGuestSessionToken, startGuestSession } from '../services/nutrition-chat.service';
import { chatQuestionSchema, MAX_CONTEXT_MESSAGES } from '../types/nutrition-chat.schema';

export type NutritionMessage = {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  refused?: boolean;
  /** The answer is still arriving. */
  streaming?: boolean;
};

export type GuestLimit = 'quota' | 'closed';

const WELCOME: NutritionMessage = {
  id: 'welcome',
  role: 'assistant',
  text: 'Chào bạn! Mình là Trợ lý Vedora, có thể gợi ý về dinh dưỡng khi ăn thực vật. Bạn muốn hỏi gì?',
};

function limitFromError(error: unknown): GuestLimit | null {
  if (!(error instanceof ApiError)) return null;
  if (error.code === 'GUEST_QUOTA_REACHED') return 'quota';
  if (error.code === 'GUEST_CHAT_CLOSED') return 'closed';
  return null;
}

function messageForError(error: unknown, signedIn: boolean) {
  if (error instanceof ApiError) {
    if (error.status === 401 && signedIn) return 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
    if (error.status === 401) return 'Phiên hỏi thử đã hết hạn. Xác minh lại rồi gửi câu hỏi nhé.';
    if (error.status === 429) return 'Bạn gửi hơi nhanh. Đợi một chút rồi hỏi tiếp nhé.';
    if (error.status === 503) return 'Trợ lý Vedora đang tạm nghỉ. Bạn quay lại sau nhé.';
  }
  return 'Mình chưa trả lời được. Bạn thử lại nhé.';
}

/** Replaces the message with the same id, or appends it. */
function upsert(messages: NutritionMessage[], next: NutritionMessage) {
  return messages.some((message) => message.id === next.id)
    ? messages.map((message) => message.id === next.id ? next : message)
    : [...messages, next];
}

function contextWithoutRefusals(messages: NutritionMessage[]) {
  return messages.filter((message, index) =>
    message.id !== WELCOME.id && !message.refused && !messages[index + 1]?.refused,
  );
}

/** Conversation state is local to this screen; quota and verification are decided by the API. */
export function useNutritionChat(getTurnstileToken?: () => Promise<string>) {
  const [messages, setMessages] = useState<NutritionMessage[]>([WELCOME]);
  const signedIn = useSessionStore((state) => !!state.accessToken);
  const [guestReady, setReady] = useState(() => getGuestSessionToken() !== null);
  const [verifying, setVerifying] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [guestLimit, setLimit] = useState<GuestLimit | null>(null);
  // Accounts are not guests: no verification step and no guest quota.
  const ready = signedIn || guestReady;
  const limit = signedIn ? null : guestLimit;
  const requestIdRef = useRef(0);
  const busyRef = useRef(false);
  const abortRef = useRef<AbortController | null>(null);

  const verify = useCallback(async () => {
    if (!getTurnstileToken || verifying) return;
    setVerifying(true);
    setError(null);
    try {
      const challengeToken = await getTurnstileToken();
      await startGuestSession(challengeToken);
      setReady(true);
      setLimit(null);
    } catch (caught) {
      const serverLimit = limitFromError(caught);
      if (serverLimit) setLimit(serverLimit);
      else setError('Không xác minh được phiên hỏi thử. Bạn thử lại nhé.');
      setReady(false);
    } finally {
      setVerifying(false);
    }
  }, [getTurnstileToken, verifying]);

  const send = useCallback(async (question: string) => {
    const parsed = chatQuestionSchema.safeParse(question);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Câu hỏi chưa hợp lệ.');
      return false;
    }
    if (busyRef.current || limit) return false;
    if (!signedIn && !getGuestSessionToken()) {
      setReady(false);
      setError('Phiên hỏi thử đã hết hạn. Xác minh lại rồi gửi câu hỏi nhé.');
      return false;
    }

    const text = parsed.data;
    const id = `user-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const nextContext = contextWithoutRefusals(messages)
      .map(({ role, text: previousText }) => ({ role, text: previousText }))
      .concat({ role: 'user' as const, text })
      .slice(-MAX_CONTEXT_MESSAGES);
    const controller = new AbortController();
    abortRef.current = controller;
    const requestId = ++requestIdRef.current;
    const assistantId = `assistant-${requestId}-${Date.now()}`;
    busyRef.current = true;
    setBusy(true);
    setError(null);
    setMessages((previous) => [...previous, { id, role: 'user', text }]);

    try {
      const onText = (partial: string) => {
        if (requestId !== requestIdRef.current) return;
        setMessages((previous) => upsert(previous, { id: assistantId, role: 'assistant', text: partial, streaming: true }));
      };
      const reply = signedIn
        ? await askAccountAssistant(nextContext, controller.signal, onText)
        : await askNutritionChat(nextContext, controller.signal, onText);
      if (requestId !== requestIdRef.current) return false;
      if (!reply.text.trim() && !reply.refused) throw new Error('Trợ lý chưa trả lời được.');
      setMessages((previous) => upsert(previous, {
        id: assistantId,
        role: 'assistant',
        text: reply.text || (reply.refused ? 'Mình chưa thể trả lời câu hỏi này.' : ''),
        refused: reply.refused,
      }));
      return true;
    } catch (caught) {
      if (requestId !== requestIdRef.current) return false;
      setMessages((previous) => previous.filter((message) => message.id !== id && message.id !== assistantId));
      const serverLimit = signedIn ? null : limitFromError(caught);
      if (serverLimit) {
        setLimit(serverLimit);
      } else {
        if (!signedIn && caught instanceof ApiError && caught.status === 401) {
          clearGuestSession();
          setReady(false);
        }
        setError(messageForError(caught, signedIn));
      }
      return false;
    } finally {
      if (requestId === requestIdRef.current) {
        busyRef.current = false;
        setBusy(false);
        abortRef.current = null;
      }
    }
  }, [limit, messages, signedIn]);

  const reset = useCallback(() => {
    requestIdRef.current += 1;
    abortRef.current?.abort();
    abortRef.current = null;
    busyRef.current = false;
    setBusy(false);
    setMessages([WELCOME]);
    setError(null);
  }, []);

  const thinking = busy && !messages.some((message) => message.streaming);
  return { messages, ready, verifying, busy, thinking, error, limit, verify, send, reset, canVerify: !!getTurnstileToken };
}
