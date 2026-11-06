import { GuestOnly } from '@/features/auth/components/guest-only';
import { RegisterScreen } from '@/features/auth/components/register-screen';

export default function RegisterScreenRoute() {
  return (
    <GuestOnly>
      <RegisterScreen />
    </GuestOnly>
  );
}
