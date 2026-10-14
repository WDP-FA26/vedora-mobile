import { router } from 'expo-router';
import { useState } from 'react';

import { ApiError } from '@/shared/api/api-error';

import { useLogin } from '../hooks/use-auth-actions';
import { loginSchema } from '../types/auth.schema';
import { authErrorMessage } from '../utils/auth-errors';
import { formErrors } from '../utils/form-errors';
import { AuthButton, AuthField, AuthLink, AuthMessage, AuthScreen } from './auth-ui';

export function LoginScreen() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const login = useLogin();

  async function submit() {
    const parsed = loginSchema.safeParse({ username, password });
    if (!parsed.success) {
      setErrors(formErrors(parsed.error));
      return;
    }
    setErrors({});
    try {
      await login.mutateAsync(parsed.data);
      router.replace('/');
    } catch (error) {
      setPassword('');
      if (error instanceof ApiError && error.code === 'EMAIL_NOT_VERIFIED' && error.email) {
        router.replace({ pathname: '/verify-email', params: { email: error.email, sent: '1' } });
        return;
      }
      setErrors({ form: authErrorMessage(error, 'login') });
    }
  }

  return (
    <AuthScreen title="Chào mừng trở lại" subtitle="Đăng nhập để tiếp tục hành trình cùng Vedora.">
      <AuthField label="Tên đăng nhập" value={username} onChangeText={setUsername} autoCapitalize="none" autoCorrect={false} autoComplete="username" textContentType="username" error={errors.username} placeholder="vedora.user" />
      <AuthField label="Mật khẩu" value={password} onChangeText={setPassword} secureTextEntry autoComplete="current-password" textContentType="password" error={errors.password} placeholder="Nhập mật khẩu" onSubmitEditing={submit} returnKeyType="done" />
      {errors.form ? <AuthMessage message={errors.form} error /> : null}
      <AuthButton label="Đăng nhập" onPress={submit} pending={login.isPending} />
      <AuthLink label="Chưa có tài khoản? Đăng ký" onPress={() => router.push('/register')} />
    </AuthScreen>
  );
}
