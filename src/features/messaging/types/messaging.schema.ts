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

export const sharedPostSchema = z.object({
  id: z.string(),
  type: z.enum(['POST', 'BLOG']),
  title: z.string().nullable(),
  excerpt: z.string(),
  imageUrl: z.string().nullable(),
  author: peerSchema.extend({ isProfessional: z.boolean().default(false) }),
});

export const sharePostInputSchema = z.object({
  clientMessageId: z.uuid({ version: 'v4' }),
  postId: z.uuid({ version: 'v4' }),
});

export const messageSchema = z.object({
  id: z.string(),
  conversationId: z.string(),
  senderId: z.string(),
  recipientId: z.string(),
  clientMessageId: z.string(),
  sequence: z.number().int(),
  body: z.string(),
  sharedPostId: z.string().nullable().default(null),
  sharedPost: sharedPostSchema.nullable().default(null),
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
  /** Receiver only, while the request is pending: show Chấp nhận / Xóa. Defaults keep an older API working. */
  canAcceptRequest: z.boolean().default(false),
  canDeleteRequest: z.boolean().default(false),
  /** Messages at or below this sequence were deleted on your side and must not be shown. */
  deletedThroughSequence: z.number().int().nonnegative().default(0),
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

export const deleteRequestResultSchema = z.object({
  conversationId: z.string(),
  deletedThroughSequence: z.number().int().nonnegative(),
});

export const readResultSchema = z.object({
  conversationId: z.string(),
  readSequence: z.number().int().nonnegative(),
  unreadCount: z.number().int().nonnegative(),
});

export type Peer = z.output<typeof peerSchema>;
export type Message = z.output<typeof messageSchema>;
export type SharePostInput = z.output<typeof sharePostInputSchema>;
export type Contact = z.output<typeof contactSchema>;
export type Conversation = z.output<typeof conversationSchema>;
