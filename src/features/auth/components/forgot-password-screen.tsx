import { router } from 'expo-router';
import { useState } from 'react';

import { ApiError } from '@/shared/api/api-error';

import { useRequestPasswordReset } from '../hooks/use-auth-actions';
import { forgotPasswordSchema } from '../types/auth.schema';
import { authErrorMessage } from '../utils/auth-errors';
import { formErrors } from '../utils/form-errors';
import { AuthButton, AuthField, AuthLink, AuthMessage, AuthScreen } from './auth-ui';

export function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const request = useRequestPasswordReset();

  async function submit() {
    const parsed = forgotPasswordSchema.safeParse({ email });
    if (!parsed.success) {
      setErrors(formErrors(parsed.error));
      return;
    }
    setErrors({});
    try {
      await request.mutateAsync(parsed.data);
      // The API answers the same for unknown emails, so always move on.
      router.replace({ pathname: '/reset-password', params: { email: parsed.data.email } });
    } catch (error) {
      setErrors({
        form: error instanceof ApiError && error.status === 429
          ? 'Bạn đã yêu cầu mã quá nhiều lần. Vui lòng thử lại sau 1 giờ.'
          : authErrorMessage(error, 'reset'),
      });
    }
  }

  return (
    <AuthScreen title="Quên mật khẩu" subtitle="Nhập email tài khoản, Vedora sẽ gửi mã 6 chữ số để đặt lại mật khẩu.">
      <AuthField label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" autoCorrect={false} keyboardType="email-address" autoComplete="email" error={errors.email} placeholder="ban@example.com" onSubmitEditing={submit} />
      {errors.form ? <AuthMessage message={errors.form} error /> : null}
      <AuthButton label="Gửi mã" onPress={submit} pending={request.isPending} />
      <AuthLink label="Quay lại đăng nhập" onPress={() => router.replace('/login')} />
    </AuthScreen>
  );
}
