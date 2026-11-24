export const mealLogKeys = {
  all: ['meal-log'] as const,
  week: (weekStart?: string) => ['meal-log', weekStart ?? 'current'] as const,
};
