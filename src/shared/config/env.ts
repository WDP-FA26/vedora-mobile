import { z } from 'zod';

const envSchema = z.object({
  EXPO_PUBLIC_API_URL: z.url().default('http://localhost:4000/api/v1'),
});

// Expo only inlines static process.env.EXPO_PUBLIC_* references.
const env = envSchema.parse({
  EXPO_PUBLIC_API_URL: process.env.EXPO_PUBLIC_API_URL,
});

export const API_BASE_URL = env.EXPO_PUBLIC_API_URL.replace(/\/+$/, '');
