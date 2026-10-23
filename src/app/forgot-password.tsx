import { GuestOnly } from '@/features/auth/components/guest-only';
import { ForgotPasswordScreen } from '@/features/auth/components/forgot-password-screen';

export default function ForgotPasswordScreenRoute() {
  return (
    <GuestOnly>
      <ForgotPasswordScreen />
    </GuestOnly>
  );
}
