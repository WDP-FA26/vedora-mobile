import { requestJson } from '@/shared/api/request-json';

import { shoppingListSchema, shoppingRequestSchema } from '../types/shopping-list.schema';
import type { Weekday } from '../types/meal-plan.schema';

export function getShoppingList(weekStart: string, days: Weekday[], signal?: AbortSignal) {
  const input = shoppingRequestSchema.parse({ weekStart, days });
  return requestJson(shoppingListSchema, { method: 'GET', url: '/meal-plan/shopping-list', params: { weekStart: input.weekStart, days: input.days.join(',') }, signal });
}
