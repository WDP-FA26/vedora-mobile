import { z } from 'zod';

import { mealSections, weekdays, weekStartSchema } from './meal-plan.schema';

export const shoppingRequestSchema = z.object({ weekStart: weekStartSchema, days: z.array(z.enum(weekdays)).min(1).max(7) });
export const shoppingListSchema = z.object({
  weekStart: weekStartSchema, days: z.array(z.enum(weekdays)), quantityBasis: z.literal('RECIPE_PER_OCCURRENCE'),
  items: z.array(z.object({
    ingredientId: z.string(), name: z.string(), unit: z.string().nullable(), knownQuantity: z.string().nullable(), hasUnknownQuantity: z.boolean(),
    contributions: z.array(z.object({ recipeId: z.string(), recipeTitle: z.string(), day: z.enum(weekdays), section: z.enum(mealSections), servings: z.number(), quantity: z.string().nullable(), note: z.string().nullable() })),
  })),
});
export const shoppingPreferencesSchema = z.object({ people: z.number().int().min(1).max(4).default(1), checked: z.array(z.string()).default([]) });
export type ShoppingList = z.output<typeof shoppingListSchema>;
export type ShoppingItem = ShoppingList['items'][number];
export type ShoppingPreferences = z.output<typeof shoppingPreferencesSchema>;
