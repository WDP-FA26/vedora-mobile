import { z } from 'zod';

export const googleAuthorizationSchema = z.object({
  url: z.string().url(),
  state: z.string().regex(/^[A-Za-z0-9_-]{43}$/),
  codeVerifier: z.string().regex(/^[A-Za-z0-9._~-]{43,128}$/),
});
