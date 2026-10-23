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
