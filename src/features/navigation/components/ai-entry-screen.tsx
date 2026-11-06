import { PlannerChatScreen } from '@/features/meal-plan/components/planner-chat-screen';
import { NutritionChatScreen } from '@/features/nutrition-chat/components/nutrition-chat-screen';
import { useTurnstilePrompt } from '@/shared/components/turnstile-prompt';
import { useSessionStore } from '@/shared/stores/session-store';

/**
 * Trợ lý Vedora tab. Signed-in users get the assistant that also plans menus (shown in the Thực đơn tab);
 * guests get the quick nutrition Q&A, whose verification runs a Turnstile challenge.
 */
export function AiEntryScreen() {
  const token = useSessionStore((state) => state.accessToken);
  const turnstile = useTurnstilePrompt();
  if (token) return <PlannerChatScreen />;
  return (
    <>
      <NutritionChatScreen getTurnstileToken={turnstile.request} />
      {turnstile.element}
    </>
  );
}
