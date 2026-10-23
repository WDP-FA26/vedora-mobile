import { useMutation } from '@tanstack/react-query';

import { acceptSession, clearSession } from '@/shared/session/session-manager';
import { useSessionStore } from '@/shared/stores/session-store';

import { login, logout, register, requestPasswordReset, resendVerification, resetPassword, verifyEmail } from '../services/auth.service';

export function useLogin() {
  return useMutation({
    mutationFn: login,
    onSuccess: acceptSession,
  });
}

export function useRegister() {
  return useMutation({ mutationFn: register });
}

export function useVerifyEmail() {
  return useMutation({
    mutationFn: verifyEmail,
    onSuccess: acceptSession,
  });
}

export function useResendVerification() {
  return useMutation({ mutationFn: resendVerification });
}

export function useSignOut() {
  return useMutation({
    mutationFn: async () => {
      const refreshToken = useSessionStore.getState().refreshToken;
      const results = await Promise.allSettled([
        clearSession(),
        refreshToken ? logout(refreshToken) : Promise.resolve(),
      ]);
      if (results.some((result) => result.status === 'rejected')) {
        throw new Error('Đã thoát trên thiết bị, nhưng chưa thể thu hồi phiên trên máy chủ.');
      }
    },
  });
}

export function useRequestPasswordReset() {
  return useMutation({ mutationFn: requestPasswordReset });
}

export function useResetPassword() {
  return useMutation({ mutationFn: resetPassword });
}
