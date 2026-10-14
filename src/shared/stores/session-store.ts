import { create } from 'zustand';
import { Platform } from 'react-native';

import type { SessionState } from '../types/session';

export const useSessionStore = create<SessionState>()((set) => ({
  accessToken: null,
  accessTokenExpiresAt: null,
  refreshToken: null,
  displayName: null,
  isHydrated: Platform.OS === 'web',
  setSession: ({ accessToken, accessTokenExpiresAt, refreshToken, displayName }) => set({ accessToken, accessTokenExpiresAt, refreshToken, displayName }),
  restoreRefreshToken: (refreshToken) => set({ refreshToken }),
  finishHydration: () => set({ isHydrated: true }),
  clearSession: () => set({ accessToken: null, accessTokenExpiresAt: null, refreshToken: null, displayName: null }),
}));
