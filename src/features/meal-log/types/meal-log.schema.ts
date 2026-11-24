import { z } from 'zod';

import { mealSections, weekdays } from '@/features/meal-plan/types/meal-plan.schema';

export const MAX_NAME_LENGTH = 120;
export const MAX_DETAILS_LENGTH = 300;
export const MIN_SERVINGS = 0.25;
export const MAX_SERVINGS = 20;
export const MAX_CALORIES = 5000;

const dateSchema = z.iso.date();
const referenceSchema = z.object({ title: z.string(), url: z.string() });

export const mealLogEntrySchema = z.object({
  id: z.string(),
  date: dateSchema,
  section: z.enum(mealSections),
  source: z.enum(['PLAN', 'RECIPE', 'CUSTOM']),
  recipeId: z.string().nullable(),
  name: z.string(),
  servings: z.number(),
  caloriesPerServing: z.number().nullable(),
  calories: z.number().nullable(),
  calorieSource: z.enum(['RECIPE', 'USER', 'WEB_ESTIMATE']).nullable(),
  calorieNote: z.string().nullable(),
  calorieReferences: z.array(referenceSchema),
});

export const mealLogWeekSchema = z.object({
  weekStart: dateSchema,
  today: dateSchema,
  dailyCalorieTarget: z.number().nullable(),
  dailyCalorieMin: z.number().nullable(),
  dailyCalorieMax: z.number().nullable(),
  days: z.array(z.object({
    day: z.enum(weekdays),
    date: dateSchema,
    loggable: z.boolean(),
    entries: z.array(mealLogEntrySchema),
    loggedCalories: z.number(),
    unknownCalorieEntries: z.number(),
    plannedCalories: z.number().nullable(),
  })),
  summary: z.object({
    loggedDays: z.number(),
    completeDays: z.number(),
    averageCalories: z.number().nullable(),
    remainingDays: z.number(),
  }),
});

export const calorieEstimateSchema = z.object({
  caloriesPerServing: z.number().nullable(),
  note: z.string().nullable(),
  references: z.array(referenceSchema),
});

const servings = z.number().min(MIN_SERVINGS).max(MAX_SERVINGS).optional();

/** Body of `POST /meal-plan/log`: exactly one of `recipeId` (catalog dish) or `name` (any other dish). */
export const newMealLogEntrySchema = z.object({ date: dateSchema, section: z.enum(mealSections), servings }).and(z.union([
  z.object({ recipeId: z.string().min(1) }),
  z.object({
    name: z.string().trim().min(1).max(MAX_NAME_LENGTH),
    caloriesPerServing: z.number().int().min(0).max(MAX_CALORIES).optional(),
    calorieSource: z.enum(['USER', 'WEB_ESTIMATE']).optional(),
    calorieNote: z.string().max(500).optional(),
    calorieReferences: z.array(referenceSchema).max(5).optional(),
  }),
]));

export type MealLogEntry = z.output<typeof mealLogEntrySchema>;
export type MealLogWeek = z.output<typeof mealLogWeekSchema>;
export type MealLogDay = MealLogWeek['days'][number];
export type CalorieEstimate = z.output<typeof calorieEstimateSchema>;
export type NewMealLogEntry = z.input<typeof newMealLogEntrySchema>;
