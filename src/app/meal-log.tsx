import { MealLogScreen } from '@/features/meal-log/components/meal-log-screen';
import { useSessionStore } from '@/shared/stores/session-store';

export default function MealLogRoute() {
  const token = useSessionStore((state) => state.accessToken);
  return <MealLogScreen key={token ?? 'guest'} />;
}
