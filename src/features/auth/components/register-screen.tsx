import { router } from 'expo-router';
import { useState } from 'react';

import { useRegister } from '../hooks/use-auth-actions';
import { registerSchema } from '../types/auth.schema';
import { authErrorMessage } from '../utils/auth-errors';
import { formErrors } from '../utils/form-errors';
import { AuthButton, AuthField, AuthLink, AuthMessage, AuthScreen } from './auth-ui';

export function RegisterScreen() {
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const register = useRegister();

  async function submit() {
    const parsed = registerSchema.safeParse({ fullName, username, email, password, confirmPassword });
    if (!parsed.success) {
      setErrors(formErrors(parsed.error));
      return;
    }
    setErrors({});
    try {
      const result = await register.mutateAsync(parsed.data);
      setPassword('');
      setConfirmPassword('');
      router.replace({ pathname: '/verify-email', params: { email: result.email, sent: '1' } });
    } catch (error) {
      setErrors({ form: authErrorMessage(error, 'register') });
    }
  }

  return (
    <AuthScreen title="Tạo tài khoản" subtitle="Đăng ký bằng email để bắt đầu sử dụng Vedora.">
      <AuthField label="Họ và tên" value={fullName} onChangeText={setFullName} autoComplete="name" textContentType="name" error={errors.fullName} placeholder="Nguyễn Văn An" />
      <AuthField label="Tên đăng nhập" value={username} onChangeText={setUsername} autoCapitalize="none" autoCorrect={false} autoComplete="username-new" error={errors.username} placeholder="vedora.user" />
      <AuthField label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" autoCorrect={false} keyboardType="email-address" autoComplete="email" textContentType="emailAddress" error={errors.email} placeholder="ban@example.com" />
      <AuthField label="Mật khẩu" value={password} onChangeText={setPassword} secureTextEntry autoComplete="new-password" textContentType="newPassword" error={errors.password} placeholder="Ít nhất 8 ký tự" />
      <AuthField label="Nhập lại mật khẩu" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry autoComplete="new-password" error={errors.confirmPassword} placeholder="Nhập lại mật khẩu" />
      {errors.form ? <AuthMessage message={errors.form} error /> : null}
      <AuthButton label="Tạo tài khoản" onPress={submit} pending={register.isPending} />
      <AuthLink label="Đã có tài khoản? Đăng nhập" onPress={() => router.replace('/login')} />
    </AuthScreen>
  );
}
