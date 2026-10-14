export type SessionState = {
  /** Access token stays in memory; native refresh tokens are stored in SecureStore. */
  accessToken: string | null;
  accessTokenExpiresAt: number | null;
  refreshToken: string | null;
  displayName: string | null;
  isHydrated: boolean;
  setSession: (session: { accessToken: string; accessTokenExpiresAt: number; refreshToken: string; displayName: string }) => void;
  restoreRefreshToken: (token: string) => void;
  finishHydration: () => void;
  clearSession: () => void;
};
