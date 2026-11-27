import { z } from 'zod';

import { mealPlanSchema, mealSections, planChangeSchema, weekdays, weekStartSchema } from './meal-plan.schema';

export const MAX_DISHES = 5;
const ids = z.array(z.uuid()).max(MAX_DISHES).refine((value) => new Set(value).size === value.length);
export const saveMealDaysSchema = z.object({
  weekStart: weekStartSchema,
  days: z.array(z.object({ day: z.enum(weekdays), breakfast: ids, lunch: ids, dinner: ids, others: ids }))
    .min(1).max(7).refine((days) => new Set(days.map((day) => day.day)).size === days.length),
});
export const generateMealsSchema = z.object({
  weekStart: weekStartSchema,
  days: z.array(z.enum(weekdays)).min(1).max(7),
  sections: z.array(z.enum(mealSections)).min(1).max(4),
  onlyEmpty: z.boolean(),
  maxMinutes: z.number().int().min(1).max(240).optional(),
  query: z.string().trim().max(100).optional(),
});
export const generatedMealsSchema = planChangeSchema.omit({ applied: true }).extend({ weekStart: weekStartSchema.optional() });
export type GenerateMeals = z.output<typeof generateMealsSchema>;
export type GeneratedMeals = z.output<typeof generatedMealsSchema>;
export type SaveMealDays = z.output<typeof saveMealDaysSchema>;
export { mealPlanSchema };
