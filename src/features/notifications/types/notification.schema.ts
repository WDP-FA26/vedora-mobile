import { z } from 'zod';

export const notificationSchema = z.object({
  id: z.string(),
  /** Kept as a string so a type added on the backend never fails the whole page. */
  type: z.string(),
  /** Null for notifications from Vedora itself (moderation, reports). */
  actor: z.object({
    id: z.string(),
    username: z.string(),
    fullName: z.string(),
    avatarUrl: z.string().nullable().optional(),
  }).nullable(),
  /** Null for `FOLLOW` and for removed posts. */
  postId: z.string().nullable(),
  postType: z.enum(['POST', 'BLOG']).nullable().optional(),
  commentId: z.string().nullable().optional(),
  reason: z.string().nullable().optional(),
  reasonText: z.string().nullable().optional(),
  note: z.string().nullable().optional(),
  readAt: z.string().nullable(),
  createdAt: z.string(),
});

export const notificationPageSchema = z.object({
  items: z.array(notificationSchema),
  nextCursor: z.string().nullable(),
});

export const unreadCountSchema = z.object({ unreadCount: z.number().int().nonnegative() });

export type AppNotification = z.output<typeof notificationSchema>;
export type NotificationPage = z.output<typeof notificationPageSchema>;
