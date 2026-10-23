import { MealPlannerScreen } from '@/features/meal-plan/components/meal-planner-screen';
import { useSessionStore } from '@/shared/stores/session-store';

export function MealPlanEntryScreen() {
  const token = useSessionStore((state) => state.accessToken);
  return <MealPlannerScreen key={token ?? 'guest'} />;
}
