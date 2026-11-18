export const mealPlanKeys = {
  plan: ['meal-plan'] as const,
  dietary: ['dietary', 'me'] as const,
  // Own root so invalidating the plan ('meal-plan') never refetches the chat.
  plannerThread: ['meal-plan-chat', 'latest'] as const,
};
