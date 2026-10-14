import { useMutation } from '@tanstack/react-query';

import { acceptSession } from '@/shared/session/session-manager';

import { login, register, resendVerification, verifyEmail } from '../services/auth.service';

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
