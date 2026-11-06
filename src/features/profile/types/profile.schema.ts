import { z } from 'zod';

export const profileSchema = z.object({
  id: z.string(),
  username: z.string(),
  fullName: z.string(),
  bio: z.string().nullable(),
  avatarUrl: z.string().nullable(),
  coverUrl: z.string().nullable(),
  isProfessional: z.boolean(),
  createdAt: z.string(),
  postCount: z.number().int().nonnegative(),
  followerCount: z.number().int().nonnegative(),
  followingCount: z.number().int().nonnegative(),
});

export const profileEditSchema = z.object({
  fullName: z.string().trim().min(1, 'Nhập tên hiển thị').max(100, 'Tên tối đa 100 ký tự'),
  bio: z.string().trim().max(500, 'Giới thiệu tối đa 500 ký tự'),
});

export type Profile = z.output<typeof profileSchema>;
export type ProfileEdit = z.output<typeof profileEditSchema>;

export const profileSummarySchema = z.object({
  id: z.string(),
  username: z.string(),
  fullName: z.string(),
  bio: z.string().nullable(),
  avatarUrl: z.string().nullable(),
  coverUrl: z.string().nullable(),
  isProfessional: z.boolean(),
});

export const profilePageSchema = z.object({
  items: z.array(profileSummarySchema),
  nextCursor: z.string().nullable(),
});

export const relationshipSchema = z.object({ isFollowing: z.boolean() });

export type ProfileSummary = z.output<typeof profileSummarySchema>;
export type ProfileListKind = 'followers' | 'following';

export const IMAGE_KINDS = ['AVATAR', 'COVER'] as const;
export type ImageKind = (typeof IMAGE_KINDS)[number];
export const IMAGE_CONTENT_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const MAX_IMAGE_MB = { AVATAR: 5, COVER: 10 } as const;

export const imageUploadSchema = z.object({
  id: z.string(),
  upload: z.object({
    url: z.string(),
    method: z.literal('PUT'),
    headers: z.record(z.string(), z.string()),
    expiresAt: z.string(),
  }),
});

export const usernameSchema = z.string().trim().toLowerCase()
  .min(3, 'Tên đăng nhập cần ít nhất 3 ký tự')
  .max(30, 'Tên đăng nhập tối đa 30 ký tự')
  .regex(/^[a-z0-9._-]+$/, 'Chỉ dùng chữ thường, số, dấu chấm, gạch dưới hoặc gạch ngang');

export type ImageUploadTarget = z.output<typeof imageUploadSchema>;

export const followSuggestionSchema = profileSummarySchema.extend({
  reason: z.enum(['FOLLOWS_YOU', 'MUTUAL', 'ACTIVE']),
  mutualCount: z.number(),
});

export const followSuggestionListSchema = z.object({ items: z.array(followSuggestionSchema) });

export type FollowSuggestion = z.output<typeof followSuggestionSchema>;
export type FollowSuggestionList = z.output<typeof followSuggestionListSchema>;
