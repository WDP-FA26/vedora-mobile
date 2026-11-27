import { Platform } from 'react-native';
import { ZodError } from 'zod';

import { ApiError } from '@/shared/api/api-error';
import { useSessionStore } from '@/shared/stores/session-store';
import type { AuthResponse } from '@/shared/types/auth-response';

import { deleteRefreshToken, readRefreshToken, saveRefreshToken } from './refresh-token-storage';

type RefreshRequest = (refreshToken: string) => Promise<AuthResponse>;

let requestRefresh: RefreshRequest | null = null;
let revision = 0;
let storageTail: Promise<void> = Promise.resolve();
let refreshFlight: { token: string; promise: Promise<string> } | null = null;
let hydrationPromise: Promise<void> | null = null;
let switchFlight: Promise<void> | null = null;

/** Stable across token refresh, changes when a login, switch or sign-out supersedes work. */
export function getSessionRevision(): number { return revision; }

/** The API client registers its refresh request without creating a module cycle. */
export function registerRefreshRequest(request: RefreshRequest): void {
  requestRefresh = request;
}

function serializeStorage<T>(operation: () => Promise<T>): Promise<T> {
  const result = storageTail.then(operation);
  storageTail = result.then(() => undefined, () => undefined);
  return result;
}

/** A new login supersedes every earlier refresh in flight. */
export async function acceptSession(session: AuthResponse): Promise<void> {
  const expectedRevision = ++revision;
  try {
    await serializeStorage(async () => {
      if (revision !== expectedRevision) return;
      await saveRefreshToken(session.refreshToken);
      if (revision !== expectedRevision) return;
      useSessionStore.getState().setSession({
        accessToken: session.accessToken,
        accessTokenExpiresAt: Date.now() + session.accessTokenExpiresIn * 1000,
        refreshToken: session.refreshToken,
        displayName: session.user.fullName,
        userId: session.user.id,
        actor: session.actor,
      });
    });
  } catch (error) {
    if (revision === expectedRevision) await clearSession();
    throw error;
  }
}

export async function clearSession(): Promise<void> {
  revision++;
  useSessionStore.getState().clearSession();
  await serializeStorage(deleteRefreshToken);
}

/** Exactly one rotation is sent for a token, even when many requests get 401. */
export function refreshSession(): Promise<string> {
  if (switchFlight) return switchFlight.then(() => {
    const token = useSessionStore.getState().accessToken;
    if (!token) throw new Error('No active session');
    return token;
  });
  const token = useSessionStore.getState().refreshToken;
  if (!token || !requestRefresh) return Promise.reject(new Error('No refresh session available'));
  if (refreshFlight?.token === token) return refreshFlight.promise;

  const expectedRevision = revision;
  const promise = (async () => {
    let rotated = false;
    try {
      const session = await requestRefresh(token);
      rotated = true;
      if (revision !== expectedRevision || useSessionStore.getState().refreshToken !== token) {
        throw new Error('Session changed during refresh');
      }
      await serializeStorage(async () => {
        if (revision !== expectedRevision || useSessionStore.getState().refreshToken !== token) {
          throw new Error('Session changed during refresh');
        }
        await saveRefreshToken(session.refreshToken);
        if (revision !== expectedRevision) return;
        useSessionStore.getState().setSession({
          accessToken: session.accessToken,
          accessTokenExpiresAt: Date.now() + session.accessTokenExpiresIn * 1000,
          refreshToken: session.refreshToken,
          displayName: session.user.fullName,
          userId: session.user.id,
          actor: session.actor,
        });
      });
      if (revision !== expectedRevision) throw new Error('Session changed during refresh');
      return session.accessToken;
    } catch (error) {
      const stillCurrent = revision === expectedRevision && useSessionStore.getState().refreshToken === token;
      if (stillCurrent && (rotated || (error instanceof ApiError && error.status === 401) || error instanceof ZodError)) {
        await clearSession();
      }
      throw error;
    }
  })();

  refreshFlight = { token, promise };
  void promise.then(
    () => { if (refreshFlight?.promise === promise) refreshFlight = null; },
    () => { if (refreshFlight?.promise === promise) refreshFlight = null; }
  );
  return promise;
}

/** Switching revokes the old refresh token; serialize it with token rotation. */
export function switchSession(request: (refreshToken: string, accessToken: string) => Promise<AuthResponse>): Promise<void> {
  if (switchFlight) return switchFlight;
  const currentExpiry = useSessionStore.getState().accessTokenExpiresAt;
  const pendingRefresh = refreshFlight?.promise ?? (currentExpiry !== null && currentExpiry <= Date.now() + 30_000 ? refreshSession() : null);
  const startRevision = revision;
  const promise = (async () => {
    if (pendingRefresh) await pendingRefresh;
    if (revision !== startRevision) throw new Error('Session changed');
    const current = useSessionStore.getState();
    if (!current.refreshToken || !current.accessToken) throw new Error('Vui lòng đăng nhập lại.');
    const expectedRevision = ++revision;
    let session: AuthResponse;
    try {
      session = await request(current.refreshToken, current.accessToken);
    } catch (error) {
      if (revision === expectedRevision && error instanceof ZodError) await clearSession();
      throw error;
    }
    if (revision !== expectedRevision || useSessionStore.getState().refreshToken !== current.refreshToken) throw new Error('Session changed');
    await acceptSession(session);
  })();
  switchFlight = promise;
  void promise.then(() => { if (switchFlight === promise) switchFlight = null; }, () => { if (switchFlight === promise) switchFlight = null; });
  return promise;
}

/** Native startup rotates the stored token before authenticated screens render. */
export function hydrateSession(): Promise<void> {
  if (Platform.OS === 'web') return Promise.resolve();
  if (hydrationPromise) return hydrationPromise;

  hydrationPromise = (async () => {
    const expectedRevision = revision;
    try {
      const token = await readRefreshToken();
      if (token && revision === expectedRevision && !useSessionStore.getState().refreshToken) {
        useSessionStore.getState().restoreRefreshToken(token);
        await refreshSession().catch(() => undefined);
      }
    } finally {
      useSessionStore.getState().finishHydration();
    }
  })();
  return hydrationPromise;
}
