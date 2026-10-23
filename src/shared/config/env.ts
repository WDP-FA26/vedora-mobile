import { z } from 'zod';

const envSchema = z.object({
  EXPO_PUBLIC_API_URL: z.url().default('http://localhost:4000/api/v1'),
  EXPO_PUBLIC_TURNSTILE_SITE_KEY: z.string().optional(),
  EXPO_PUBLIC_TURNSTILE_ORIGIN: z.url().default('https://localhost'),
  EXPO_PUBLIC_WEB_URL: z.url().default('https://vedora.app'),
});

// Expo only inlines static process.env.EXPO_PUBLIC_* references.
const env = envSchema.parse({
  EXPO_PUBLIC_API_URL: process.env.EXPO_PUBLIC_API_URL,
  EXPO_PUBLIC_TURNSTILE_SITE_KEY: process.env.EXPO_PUBLIC_TURNSTILE_SITE_KEY || undefined,
  EXPO_PUBLIC_TURNSTILE_ORIGIN: process.env.EXPO_PUBLIC_TURNSTILE_ORIGIN || undefined,
  EXPO_PUBLIC_WEB_URL: process.env.EXPO_PUBLIC_WEB_URL || undefined,
});

export const API_BASE_URL = env.EXPO_PUBLIC_API_URL.replace(/\/+$/, '');

/** Public Turnstile key. Development falls back to Cloudflare's always-pass test key; production must set a real one. */
export const TURNSTILE_SITE_KEY =
  env.EXPO_PUBLIC_TURNSTILE_SITE_KEY || (__DEV__ ? '1x00000000000000000000AA' : '');
/** Hostname the widget is loaded from; must be allowed by the Cloudflare widget. */
export const TURNSTILE_ORIGIN = env.EXPO_PUBLIC_TURNSTILE_ORIGIN;

/** Public web app origin, used to build share links. */
export const WEB_URL = env.EXPO_PUBLIC_WEB_URL.replace(/\/+$/, '');
