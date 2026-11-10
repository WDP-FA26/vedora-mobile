import Constants, { ExecutionEnvironment } from 'expo-constants';
import { openAuthSessionAsync } from 'expo-web-browser';
import { Platform } from 'react-native';

import { requestJson } from '@/shared/api/request-json';
import { acceptSession } from '@/shared/session/session-manager';
import { authResponseSchema } from '@/shared/types/auth-response';

import { googleAuthorizationSchema } from '../types/google.schema';
import { GOOGLE_CALLBACK, googleAuthorizationUrl, googleCallbackCode, isGoogleCallback } from '../utils/google-oauth';
import { authReturnTo } from '../utils/return-to';

type Destination = ReturnType<typeof authReturnTo>;
let activeFlow: Promise<Destination | null> | null = null;

export function signInWithGoogle(returnTo: string): Promise<Destination | null> {
  if (activeFlow) return activeFlow;
  if (Platform.OS === 'web' || Constants.executionEnvironment === ExecutionEnvironment.StoreClient) {
    return Promise.reject(new Error('GOOGLE_NATIVE_BUILD_REQUIRED'));
  }
  const flow = (async () => {
    const startedAt = Date.now();
    const authorization = await requestJson(googleAuthorizationSchema, {
      method: 'POST', url: '/auth/google/authorize', data: {}, skipAuthRefresh: true,
    });
    const result = await openAuthSessionAsync(googleAuthorizationUrl(authorization.url, authorization.state), GOOGLE_CALLBACK);
    if (result.type !== 'success') return null;
    const code = googleCallbackCode(result.url, authorization.state, startedAt);
    const session = await requestJson(authResponseSchema, {
      method: 'POST', url: '/auth/google', data: { code, codeVerifier: authorization.codeVerifier }, skipAuthRefresh: true,
    });
    await acceptSession(session);
    return authReturnTo(returnTo);
  })();
  activeFlow = flow;
  void flow.then(() => { activeFlow = null; }, () => { activeFlow = null; });
  return flow;
}

// Android also delivers the browser callback to Expo Router. Never turn its code into route params.
export async function googleNativeIntent(path: string): Promise<string> {
  if (!isGoogleCallback(path)) return path;
  return await activeFlow?.catch(() => null) || '/login?googleError=1';
}
