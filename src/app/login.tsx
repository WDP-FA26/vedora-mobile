import { GuestOnly } from '@/features/auth/components/guest-only';
import { LoginScreen } from '@/features/auth/components/login-screen';

export default function LoginScreenRoute() {
  return (
    <GuestOnly>
      <LoginScreen />
    </GuestOnly>
  );
}
