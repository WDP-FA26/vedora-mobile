import { DietaryProfileScreen } from '@/features/dietary-profile/components/dietary-profile-screen';
import { useSessionStore } from '@/shared/stores/session-store';

export default function DietaryProfileRoute() {
  const token = useSessionStore((state) => state.accessToken);
  return <DietaryProfileScreen key={token ?? 'guest'} />;
}
