import { requestJson } from '@/shared/api/request-json';

import {
  contactSchema,
  conversationPageSchema,
  conversationSchema,
  messagePageSchema,
  readResultSchema,
  sendResultSchema,
  type MessagingBox,
} from '../types/messaging.schema';

const INBOX_PAGE_SIZE = 20;
const HISTORY_PAGE_SIZE = 30;

export function getContact(userId: string, signal?: AbortSignal) {
  return requestJson(contactSchema, { method: 'GET', url: `/messaging/users/${userId}`, signal });
}

export function getConversations({ box, cursor, limit = INBOX_PAGE_SIZE, signal }: {
  box: MessagingBox;
  cursor: string | null;
  limit?: number;
  signal?: AbortSignal;
}) {
  return requestJson(conversationPageSchema, {
    method: 'GET',
    url: '/messaging/conversations',
    params: { box, limit, ...(cursor ? { cursor } : {}) },
    signal,
  });
}

export function getConversation(id: string, signal?: AbortSignal) {
  return requestJson(conversationSchema, { method: 'GET', url: `/messaging/conversations/${id}`, signal });
}

export function getMessages({ id, cursor, signal }: { id: string; cursor: string | null; signal?: AbortSignal }) {
  return requestJson(messagePageSchema, {
    method: 'GET',
    url: `/messaging/conversations/${id}/messages`,
    params: { limit: HISTORY_PAGE_SIZE, ...(cursor ? { cursor } : {}) },
    signal,
  });
}

/** Sends into an existing conversation, or to a user when there is none yet. Reuse `clientMessageId` for a retry. */
export function sendMessage({ conversationId, userId, clientMessageId, body }: {
  conversationId?: string | null;
  userId?: string;
  clientMessageId: string;
  body: string;
}) {
  const url = conversationId ? `/messaging/conversations/${conversationId}/messages` : `/messaging/users/${userId}/messages`;
  return requestJson(sendResultSchema, { method: 'POST', url, data: { clientMessageId, body } });
}

export function markConversationRead(id: string, messageId: string) {
  return requestJson(readResultSchema, { method: 'PUT', url: `/messaging/conversations/${id}/read`, data: { messageId } });
}
