export const mealPlanKeys = {
  plan: ['meal-plan'] as const,
  week: (weekStart?: string) => ['meal-plan', weekStart ?? 'current'] as const,
  dietary: ['dietary', 'me'] as const,
  shopping: ['meal-plan-shopping'] as const,
  shoppingList: (weekStart: string, days: readonly string[]) => ['meal-plan-shopping', weekStart, ...days] as const,
  // Own root so invalidating the plan ('meal-plan') never refetches the chat.
  plannerHistory: ['meal-plan-chat'] as const,
  plannerThread: ['meal-plan-chat', 'latest'] as const,
  plannerThreads: ['meal-plan-chat', 'list'] as const,
};
