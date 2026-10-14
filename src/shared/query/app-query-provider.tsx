import NetInfo from '@react-native-community/netinfo';
import { focusManager, onlineManager, QueryClientProvider } from '@tanstack/react-query';
import { useEffect, useState, type PropsWithChildren } from 'react';
import { AppState, Platform } from 'react-native';

import { useSessionStore } from '@/shared/stores/session-store';
import { refreshSession } from '@/shared/session/session-manager';

import { createQueryClient } from './query-client';

function refreshIfNeeded() {
  const session = useSessionStore.getState();
  if (
    session.isHydrated && session.refreshToken &&
    (!session.accessToken || (session.accessTokenExpiresAt !== null && session.accessTokenExpiresAt <= Date.now() + 30_000))
  ) {
    void refreshSession().catch(() => undefined);
  }
}

export function AppQueryProvider({ children }: PropsWithChildren) {
  const [queryClient] = useState(createQueryClient);

  useEffect(() => {
    if (Platform.OS === 'web') return;

    onlineManager.setEventListener((setOnline) =>
      NetInfo.addEventListener((state) => {
        const isOnline = state.isConnected ?? true;
        setOnline(isOnline);
        if (isOnline) refreshIfNeeded();
      })
    );
    focusManager.setFocused(AppState.currentState === 'active');
    const subscription = AppState.addEventListener('change', (state) => {
      focusManager.setFocused(state === 'active');
      if (state === 'active' && onlineManager.isOnline()) refreshIfNeeded();
    });

    return () => {
      subscription.remove();
      focusManager.setFocused(undefined);
    };
  }, []);

  useEffect(() => {
    let previousToken = useSessionStore.getState().accessToken;
    return useSessionStore.subscribe(({ accessToken }) => {
      if (accessToken !== previousToken) {
        queryClient.clear();
        previousToken = accessToken;
      }
    });
  }, [queryClient]);

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
