import { MealLogScreen } from '@/features/meal-log/components/meal-log-screen';
import { useSessionStore } from '@/shared/stores/session-store';
import { useLocalSearchParams } from 'expo-router';

export default function MealLogRoute() {
  const token = useSessionStore((state) => state.accessToken);
  const { date } = useLocalSearchParams<{ date?: string }>();
  return <MealLogScreen key={`${token ?? 'guest'}:${date ?? ''}`} initialDate={date} />;
}
