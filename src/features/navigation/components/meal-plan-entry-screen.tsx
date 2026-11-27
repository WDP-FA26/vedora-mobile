import { MealPlanScreen } from '@/features/meal-plan/components/meal-plan-screen';
import { useSessionStore } from '@/shared/stores/session-store';
import { PersonalAccountNotice } from '@/features/restaurants/components/personal-account-notice';

/** The Thực đơn tab: the saved week and drafts proposed in the Trợ lý Vedora tab. */
export function MealPlanEntryScreen() {
  const actor = useSessionStore((state) => state.actor);
  if (actor) return <PersonalAccountNotice />;
  return <MealPlanScreen />;
}
