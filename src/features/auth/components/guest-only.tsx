import { Redirect, useLocalSearchParams } from 'expo-router';
import type { PropsWithChildren } from 'react';

import { useSessionStore } from '@/shared/stores/session-store';

import { authReturnTo } from '../utils/return-to';

/** Auth pages are for signed-out users: a signed-in user is sent to where they were going. */
export function GuestOnly({ children }: PropsWithChildren) {
  const { returnTo } = useLocalSearchParams<{ returnTo?: string }>();
  const signedIn = useSessionStore((state) => !!state.accessToken || !!state.refreshToken);
  if (signedIn) return <Redirect href={authReturnTo(returnTo)} />;
  return children;
}
