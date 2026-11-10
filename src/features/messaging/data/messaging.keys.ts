import type { MessagingBox } from '../types/messaging.schema';

export const messagingKeys = {
  all: ['messaging'] as const,
  inbox: (box: MessagingBox) => ['messaging', 'inbox', box] as const,
  unread: ['messaging', 'unread'] as const,
  contact: (userId: string) => ['messaging', 'contact', userId] as const,
  conversation: (id: string) => ['messaging', 'conversation', id] as const,
  messages: (id: string) => ['messaging', 'messages', id] as const,
};
