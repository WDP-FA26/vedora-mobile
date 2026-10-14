import { apiClient } from '@/shared/api/api-client';
import { requestJson } from '@/shared/api/request-json';
import { authResponseSchema } from '@/shared/types/auth-response';

import {
  loginSchema,
  registerSchema,
  verificationRequiredSchema,
  verifyEmailSchema,
  type LoginInput,
  type RegisterInput,
  type VerifyEmailInput,
} from '../types/auth.schema';

export function login(input: LoginInput) {
  return requestJson(authResponseSchema, {
    method: 'POST',
    url: '/auth/login',
    data: loginSchema.parse(input),
    skipAuthRefresh: true,
  });
}

export function register(input: RegisterInput) {
  const { confirmPassword: _, ...payload } = registerSchema.parse(input);
  return requestJson(verificationRequiredSchema, {
    method: 'POST',
    url: '/auth/register',
    data: payload,
    skipAuthRefresh: true,
  });
}

export function verifyEmail(input: VerifyEmailInput) {
  return requestJson(authResponseSchema, {
    method: 'POST',
    url: '/auth/verify-email',
    data: verifyEmailSchema.parse(input),
    skipAuthRefresh: true,
  });
}

export async function resendVerification(email: string): Promise<void> {
  await apiClient.post('/auth/verify-email/resend', { email: verifyEmailSchema.shape.email.parse(email) }, { skipAuthRefresh: true });
}

export async function logout(refreshToken: string): Promise<void> {
  await apiClient.post('/auth/logout', { refreshToken }, { skipAuthRefresh: true });
}
