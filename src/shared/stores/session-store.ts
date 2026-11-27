import { create } from 'zustand';
import { Platform } from 'react-native';

import type { SessionState } from '../types/session';

export const useSessionStore = create<SessionState>()((set) => ({
  accessToken: null,
  accessTokenExpiresAt: null,
  refreshToken: null,
  displayName: null,
  userId: null,
  actor: null,
  isHydrated: Platform.OS === 'web',
  setSession: ({ accessToken, accessTokenExpiresAt, refreshToken, displayName, userId, actor }) => set({ accessToken, accessTokenExpiresAt, refreshToken, displayName, userId: userId ?? null, actor: actor ?? null }),
  restoreRefreshToken: (refreshToken) => set({ refreshToken }),
  finishHydration: () => set({ isHydrated: true }),
  clearSession: () => set({ accessToken: null, accessTokenExpiresAt: null, refreshToken: null, displayName: null, userId: null, actor: null }),
}));
