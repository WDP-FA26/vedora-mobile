import { create, isAxiosError, isCancel } from 'axios';

import { useSessionStore } from '@/shared/stores/session-store';
import { API_BASE_URL } from '@/shared/config/env';
import { hydrateSession, refreshSession, registerRefreshRequest } from '@/shared/session/session-manager';
import { authResponseSchema } from '@/shared/types/auth-response';

import { toApiError } from './api-error';

declare module 'axios' {
  interface AxiosRequestConfig {
    skipAuthRefresh?: boolean;
    authRetried?: boolean;
  }
}

export const apiClient = create({
  baseURL: API_BASE_URL,
  timeout: 15_000,
  headers: { Accept: 'application/json' },
});

export { hydrateSession };

apiClient.interceptors.request.use(
  (config) => {
    const token = useSessionStore.getState().accessToken;
    if (token && !config.skipAuthRefresh && !config.headers.has('Authorization')) {
      config.headers.set('Authorization', `Bearer ${token}`);
    }
    return config;
  },
  undefined,
  { synchronous: true }
);

registerRefreshRequest(async (refreshToken) => {
  const { data } = await apiClient.request<unknown>({
    method: 'POST',
    url: '/auth/refresh',
    data: { refreshToken },
    skipAuthRefresh: true,
  });
  return authResponseSchema.parse(data);
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    if (isCancel(error)) return Promise.reject(error);
    if (!isAxiosError(error)) return Promise.reject(toApiError(error));

    const config = error.config;
    if (
      error.response?.status === 401 &&
      config &&
      !config.skipAuthRefresh &&
      !config.authRetried &&
      useSessionStore.getState().refreshToken
    ) {
      config.authRetried = true;
      try {
        const currentToken = useSessionStore.getState().accessToken;
        const sentToken = config.headers.get('Authorization');
        const nextToken = currentToken && sentToken !== `Bearer ${currentToken}`
          ? currentToken
          : await refreshSession();
        config.headers.set('Authorization', `Bearer ${nextToken}`);
        return apiClient.request(config);
      } catch (refreshError) {
        return Promise.reject(isCancel(refreshError) ? refreshError : toApiError(refreshError));
      }
    }

    return Promise.reject(toApiError(error));
  }
);
