import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';

import { ApiError } from '@/shared/api/api-error';
import { TurnstileChallenge } from '@/shared/components/turnstile-challenge';

import { useLogin } from '../hooks/use-auth-actions';
import { loginSchema } from '../types/auth.schema';
import { authErrorMessage } from '../utils/auth-errors';
import { formErrors } from '../utils/form-errors';
import { authReturnTo } from '../utils/return-to';
import { AuthButton, AuthField, AuthLink, AuthMessage, AuthScreen } from './auth-ui';

export function LoginScreen() {
  const { returnTo, reset } = useLocalSearchParams<{ returnTo?: string; reset?: string }>();
  const destination = authReturnTo(returnTo);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [turnstileToken, setTurnstileToken] = useState('');
  const [challengeKey, setChallengeKey] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const login = useLogin();

  /** A Turnstile token is single use: after any attempt, ask for a fresh one. */
  function resetChallenge() {
    setTurnstileToken('');
    setChallengeKey((value) => value + 1);
  }

  async function submit() {
    const parsed = loginSchema.safeParse({ username, password, turnstileToken });
    if (!parsed.success) {
      setErrors(formErrors(parsed.error));
      return;
    }
    setErrors({});
    try {
      await login.mutateAsync(parsed.data);
      router.replace(destination);
    } catch (error) {
      setPassword('');
      resetChallenge();
      if (error instanceof ApiError && error.code === 'EMAIL_NOT_VERIFIED' && error.email) {
        router.replace({ pathname: '/verify-email', params: { email: error.email, sent: '1', returnTo: destination } });
        return;
      }
      setErrors({ form: authErrorMessage(error, 'login') });
    }
  }

  return (
    <AuthScreen title="Chào mừng trở lại" subtitle="Đăng nhập để tiếp tục hành trình cùng Vedora.">
      {reset === '1' ? <AuthMessage message="Đã đặt lại mật khẩu. Hãy đăng nhập bằng mật khẩu mới." /> : null}
      <AuthField label="Tên đăng nhập" value={username} onChangeText={setUsername} autoCapitalize="none" autoCorrect={false} autoComplete="username" textContentType="username" error={errors.username} placeholder="vedora.user" />
      <AuthField label="Mật khẩu" value={password} onChangeText={setPassword} secureTextEntry autoComplete="current-password" textContentType="password" error={errors.password} placeholder="Nhập mật khẩu" onSubmitEditing={submit} returnKeyType="done" />
      <TurnstileChallenge
        key={challengeKey}
        onToken={(token) => {
          setTurnstileToken(token);
          setErrors((current) => ({ ...current, turnstileToken: '' }));
        }}
        onFailure={(message) => {
          setTurnstileToken('');
          setErrors((current) => ({ ...current, turnstileToken: message }));
        }}
      />
      {errors.turnstileToken ? <AuthMessage message={errors.turnstileToken} error /> : null}
      {errors.form ? <AuthMessage message={errors.form} error /> : null}
      <AuthButton label="Đăng nhập" onPress={submit} pending={login.isPending} disabled={!turnstileToken} />
      <AuthLink label="Quên mật khẩu?" onPress={() => router.push('/forgot-password')} />
      <AuthLink label="Chưa có tài khoản? Đăng ký" onPress={() => router.push({ pathname: '/register', params: { returnTo: destination } })} />
    </AuthScreen>
  );
}
