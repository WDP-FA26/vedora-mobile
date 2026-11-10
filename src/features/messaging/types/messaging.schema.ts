import { z } from 'zod';

/** Same limit as the API: the body is trimmed first, then must be 1–2000 characters. */
export const MAX_MESSAGE_LENGTH = 2000;

export const messagingBoxes = ['friends', 'requests'] as const;
export type MessagingBox = (typeof messagingBoxes)[number];

export const peerSchema = z.object({
  id: z.string(),
  username: z.string(),
  fullName: z.string(),
  avatarUrl: z.string().nullable(),
  isProfessional: z.boolean(),
});

export const messageSchema = z.object({
  id: z.string(),
  conversationId: z.string(),
  senderId: z.string(),
  recipientId: z.string(),
  clientMessageId: z.string(),
  sequence: z.number().int(),
  body: z.string(),
  createdAt: z.string(),
});

export const messagePageSchema = z.object({
  items: z.array(messageSchema),
  nextCursor: z.string().nullable(),
});

const relationshipShape = {
  box: z.enum(messagingBoxes),
  followsPeer: z.boolean(),
  peerFollowsYou: z.boolean(),
  canSend: z.boolean(),
};

export const contactSchema = z.object({
  peer: peerSchema,
  conversationId: z.string().nullable(),
  ...relationshipShape,
});

export const conversationSchema = z.object({
  id: z.string(),
  peer: peerSchema,
  requestDirection: z.enum(['incoming', 'outgoing']).nullable(),
  lastMessage: z.object({
    id: z.string(),
    senderId: z.string(),
    body: z.string(),
    createdAt: z.string(),
  }).nullable(),
  unreadCount: z.number().int().nonnegative(),
  myReadSequence: z.number().int().nonnegative(),
  peerReadSequence: z.number().int().nonnegative(),
  ...relationshipShape,
});

export const conversationPageSchema = z.object({
  items: z.array(conversationSchema),
  nextCursor: z.string().nullable(),
});

export const sendResultSchema = z.object({
  conversationId: z.string(),
  message: messageSchema,
});

export const readResultSchema = z.object({
  conversationId: z.string(),
  readSequence: z.number().int().nonnegative(),
  unreadCount: z.number().int().nonnegative(),
});

export type Peer = z.output<typeof peerSchema>;
export type Message = z.output<typeof messageSchema>;
export type Contact = z.output<typeof contactSchema>;
export type Conversation = z.output<typeof conversationSchema>;
