import { GuestOnly } from '@/features/auth/components/guest-only';
import { ResetPasswordScreen } from '@/features/auth/components/reset-password-screen';

export default function ResetPasswordScreenRoute() {
  return (
    <GuestOnly>
      <ResetPasswordScreen />
    </GuestOnly>
  );
}
