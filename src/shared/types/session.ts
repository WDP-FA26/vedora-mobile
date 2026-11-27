import type { AuthResponse } from './auth-response';

export type SessionState = {
  /** Access token stays in memory; native refresh tokens are stored in SecureStore. */
  accessToken: string | null;
  accessTokenExpiresAt: number | null;
  refreshToken: string | null;
  displayName: string | null;
  userId: string | null;
  actor: AuthResponse['actor'];
  isHydrated: boolean;
  setSession: (session: { accessToken: string; accessTokenExpiresAt: number; refreshToken: string; displayName: string; userId?: string; actor?: SessionState['actor'] }) => void;
  restoreRefreshToken: (token: string) => void;
  finishHydration: () => void;
  clearSession: () => void;
};
