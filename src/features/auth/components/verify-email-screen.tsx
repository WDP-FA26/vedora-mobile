import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';

import { ApiError } from '@/shared/api/api-error';

import { useResendVerification, useVerifyEmail } from '../hooks/use-auth-actions';
import { verifyEmailSchema } from '../types/auth.schema';
import { authErrorMessage } from '../utils/auth-errors';
import { formErrors } from '../utils/form-errors';
import { authReturnTo } from '../utils/return-to';
import { AuthButton, AuthField, AuthLink, AuthMessage, AuthScreen } from './auth-ui';

const RESEND_COOLDOWN_SECONDS = 120;

export function VerifyEmailScreen() {
  const params = useLocalSearchParams<{ email?: string; sent?: string; returnTo?: string }>();
  const destination = authReturnTo(params.returnTo);
  const [email, setEmail] = useState(typeof params.email === 'string' ? params.email : '');
  const [code, setCode] = useState('');
  const [secondsLeft, setSecondsLeft] = useState(params.sent === '1' ? RESEND_COOLDOWN_SECONDS : 0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState('');
  const verify = useVerifyEmail();
  const resend = useResendVerification();

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = setTimeout(() => setSecondsLeft((seconds) => seconds - 1), 1000);
    return () => clearTimeout(timer);
  }, [secondsLeft]);

  async function submit() {
    const parsed = verifyEmailSchema.safeParse({ email, code });
    if (!parsed.success) {
      setErrors(formErrors(parsed.error));
      return;
    }
    setErrors({});
    try {
      await verify.mutateAsync(parsed.data);
      router.replace(destination);
    } catch (error) {
      setCode('');
      setErrors({ form: authErrorMessage(error, 'verify') });
    }
  }

  async function resendCode() {
    const parsed = verifyEmailSchema.shape.email.safeParse(email);
    if (!parsed.success) {
      setErrors({ email: 'Email không hợp lệ' });
      return;
    }
    setErrors({});
    setNotice('');
    try {
      await resend.mutateAsync(parsed.data);
      setSecondsLeft(RESEND_COOLDOWN_SECONDS);
      setNotice('Nếu email đang chờ xác minh, mã mới đã được gửi. Hãy kiểm tra cả thư mục spam.');
    } catch (error) {
      setErrors({ form: authErrorMessage(error, 'resend') });
      if (error instanceof ApiError && error.code === 'RESEND_LIMIT_REACHED') {
        setSecondsLeft(RESEND_COOLDOWN_SECONDS);
      }
    }
  }

  return (
    <AuthScreen title="Xác minh email" subtitle="Nhập mã 6 chữ số gửi tới email của bạn. Mã có hiệu lực trong 10 phút.">
      <AuthField label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" autoCorrect={false} keyboardType="email-address" autoComplete="email" error={errors.email} placeholder="ban@example.com" />
      <AuthField label="Mã xác minh" value={code} onChangeText={(value) => setCode(value.replace(/\D/g, '').slice(0, 6))} keyboardType="number-pad" autoComplete="one-time-code" textContentType="oneTimeCode" maxLength={6} error={errors.code} placeholder="000000" onSubmitEditing={submit} />
      {errors.form ? <AuthMessage message={errors.form} error /> : null}
      {notice ? <AuthMessage message={notice} /> : null}
      <AuthButton label="Xác minh" onPress={submit} pending={verify.isPending} />
      <AuthButton label={secondsLeft > 0 ? `Gửi lại sau ${Math.floor(secondsLeft / 60)}:${String(secondsLeft % 60).padStart(2, '0')}` : 'Gửi lại mã'} onPress={resendCode} pending={resend.isPending} disabled={secondsLeft > 0} secondary />
      <AuthLink label="Dùng email khác? Đăng ký lại" onPress={() => router.replace({ pathname: '/register', params: { returnTo: destination } })} />
      <AuthLink label="Quay lại đăng nhập" onPress={() => router.replace({ pathname: '/login', params: { returnTo: destination } })} />
    </AuthScreen>
  );
}
