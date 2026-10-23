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

/** True for a backend on this machine or LAN, where the API accepts Cloudflare's test secret. */
const API_IS_LOCAL = /^(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(new URL(API_BASE_URL).hostname);

/**
 * Public Turnstile key. It must be the site key paired with the API's TURNSTILE_SECRET_KEY: a token
 * from Cloudflare's always-pass test key is only accepted by a local API using the test secret, so
 * the test key is used only for local backends and a remote API without a key reports missing config.
 */
export const TURNSTILE_SITE_KEY =
  env.EXPO_PUBLIC_TURNSTILE_SITE_KEY || (__DEV__ && API_IS_LOCAL ? '1x00000000000000000000AA' : '');
/** Hostname the widget is loaded from; must be allowed by the Cloudflare widget. */
export const TURNSTILE_ORIGIN = env.EXPO_PUBLIC_TURNSTILE_ORIGIN;

/** Public web app origin, used to build share links. */
export const WEB_URL = env.EXPO_PUBLIC_WEB_URL.replace(/\/+$/, '');
