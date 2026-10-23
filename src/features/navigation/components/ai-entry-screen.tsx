import { NutritionChatScreen } from '@/features/nutrition-chat/components/nutrition-chat-screen';
import { useTurnstilePrompt } from '@/shared/components/turnstile-prompt';

/** Quick nutrition Q&A in the AI tab. Guest verification runs a Turnstile challenge. */
export function AiEntryScreen() {
  const turnstile = useTurnstilePrompt();
  return (
    <>
      <NutritionChatScreen getTurnstileToken={turnstile.request} />
      {turnstile.element}
    </>
  );
}
