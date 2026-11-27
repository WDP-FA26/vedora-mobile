import { z } from 'zod';

export const authResponseSchema = z.object({
  actor: z.object({ id: z.uuid(), username: z.string(), fullName: z.string(), avatarUrl: z.string().nullable() }).nullable().default(null),
  accessToken: z.string().min(1),
  refreshToken: z.string().min(1),
  tokenType: z.literal('Bearer'),
  accessTokenExpiresIn: z.number(),
  refreshTokenExpiresIn: z.number(),
  user: z.object({
    id: z.string().uuid(),
    username: z.string(),
    fullName: z.string(),
    email: z.email(),
    role: z.string(),
    createdAt: z.string(),
    updatedAt: z.string(),
  }),
});

export type AuthResponse = z.output<typeof authResponseSchema>;
