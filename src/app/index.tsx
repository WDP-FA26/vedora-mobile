import { Redirect } from 'expo-router';

import { AuthHome } from '@/features/auth/components/auth-home';
import { useSessionStore } from '@/shared/stores/session-store';

export default function Index() {
  const accessToken = useSessionStore((state) => state.accessToken);
  return accessToken ? <Redirect href="/explore" /> : <AuthHome />;
}
