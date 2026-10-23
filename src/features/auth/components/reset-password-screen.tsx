import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';

import { ApiError } from '@/shared/api/api-error';

import { useRequestPasswordReset, useResetPassword } from '../hooks/use-auth-actions';
import { forgotPasswordSchema, resetPasswordSchema } from '../types/auth.schema';
import { authErrorMessage } from '../utils/auth-errors';
import { formErrors } from '../utils/form-errors';
import { AuthButton, AuthField, AuthLink, AuthMessage, AuthScreen } from './auth-ui';

const RESEND_COOLDOWN_SECONDS = 120;

export function ResetPasswordScreen() {
  const params = useLocalSearchParams<{ email?: string }>();
  const [email, setEmail] = useState(typeof params.email === 'string' ? params.email : '');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [secondsLeft, setSecondsLeft] = useState(params.email ? RESEND_COOLDOWN_SECONDS : 0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState('');
  const reset = useResetPassword();
  const resend = useRequestPasswordReset();

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = setTimeout(() => setSecondsLeft((seconds) => seconds - 1), 1000);
    return () => clearTimeout(timer);
  }, [secondsLeft]);

  async function submit() {
    const parsed = resetPasswordSchema.safeParse({ email, code, password, confirmPassword });
    if (!parsed.success) {
      setErrors(formErrors(parsed.error));
      return;
    }
    setErrors({});
    try {
      await reset.mutateAsync(parsed.data);
      router.replace({ pathname: '/login', params: { reset: '1' } });
    } catch (error) {
      setCode('');
      setErrors({
        form: error instanceof ApiError && error.status === 429
          ? 'Bạn đã nhập sai quá nhiều lần. Vui lòng thử lại sau.'
          : authErrorMessage(error, 'reset'),
      });
    }
  }

  async function resendCode() {
    const parsed = forgotPasswordSchema.safeParse({ email });
    if (!parsed.success) {
      setErrors({ email: 'Email không hợp lệ' });
      return;
    }
    setErrors({});
    setNotice('');
    try {
      await resend.mutateAsync(parsed.data);
      setSecondsLeft(RESEND_COOLDOWN_SECONDS);
      setNotice('Nếu email tồn tại, mã mới đã được gửi. Hãy kiểm tra cả thư mục spam.');
    } catch (error) {
      setErrors({
        form: error instanceof ApiError && error.status === 429
          ? 'Bạn đã gửi lại mã 3 lần. Vui lòng thử lại sau 1 giờ.'
          : authErrorMessage(error, 'resend'),
      });
    }
  }

  return (
    <AuthScreen title="Đặt lại mật khẩu" subtitle="Nhập mã 6 chữ số trong email và mật khẩu mới. Mã có hiệu lực trong 10 phút.">
      <AuthField label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" autoCorrect={false} keyboardType="email-address" autoComplete="email" error={errors.email} placeholder="ban@example.com" />
      <AuthField label="Mã xác minh" value={code} onChangeText={(value) => setCode(value.replace(/\D/g, '').slice(0, 6))} keyboardType="number-pad" autoComplete="one-time-code" textContentType="oneTimeCode" maxLength={6} error={errors.code} placeholder="000000" />
      <AuthField label="Mật khẩu mới" value={password} onChangeText={setPassword} secureTextEntry autoComplete="new-password" textContentType="newPassword" error={errors.password} placeholder="Ít nhất 8 ký tự" />
      <AuthField label="Nhập lại mật khẩu" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry autoComplete="new-password" textContentType="newPassword" error={errors.confirmPassword} placeholder="Nhập lại mật khẩu mới" onSubmitEditing={submit} returnKeyType="done" />
      {errors.form ? <AuthMessage message={errors.form} error /> : null}
      {notice ? <AuthMessage message={notice} /> : null}
      <AuthButton label="Đặt lại mật khẩu" onPress={submit} pending={reset.isPending} />
      <AuthButton label={secondsLeft > 0 ? `Gửi lại sau ${Math.floor(secondsLeft / 60)}:${String(secondsLeft % 60).padStart(2, '0')}` : 'Gửi lại mã'} onPress={resendCode} pending={resend.isPending} disabled={secondsLeft > 0} secondary />
      <AuthLink label="Quay lại đăng nhập" onPress={() => router.replace('/login')} />
    </AuthScreen>
  );
}
