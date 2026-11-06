import { GuestOnly } from '@/features/auth/components/guest-only';
import { VerifyEmailScreen } from '@/features/auth/components/verify-email-screen';

export default function VerifyEmailScreenRoute() {
  return (
    <GuestOnly>
      <VerifyEmailScreen />
    </GuestOnly>
  );
}
