import { z } from 'zod';

export const weekdays = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'] as const;
export const mealSections = ['BREAKFAST', 'LUNCH', 'DINNER', 'OTHER'] as const;
export type Weekday = (typeof weekdays)[number];
export type MealSection = (typeof mealSections)[number];

const daySchema = z.enum(weekdays);
const sectionSchema = z.enum(mealSections);
const recipeRefSchema = z.object({ id: z.string(), title: z.string() });

const recipeSchema = recipeRefSchema.extend({
  servings: z.number(),
  prepMinutes: z.number().nullable(),
  cookMinutes: z.number().nullable(),
  ingredients: z.array(z.object({
    name: z.string(), quantity: z.number().nullable(), unit: z.string().nullable(), note: z.string().nullable(),
  })),
  steps: z.array(z.string()),
});

export const mealPlanSchema = z.object({
  days: z.array(z.object({
    day: daySchema,
    sections: z.array(z.object({ section: sectionSchema, recipes: z.array(recipeSchema) })),
  })),
  problems: z.array(z.object({
    code: z.enum(['UNKNOWN_RECIPE', 'AVOIDED_INGREDIENT', 'DAY_CONFLICT']),
    day: daySchema,
    recipes: z.array(z.string()),
    ingredients: z.array(z.string()),
    reason: z.string().nullable(),
  })),
});

export const proposalSchema = z.object({
  ok: z.boolean(),
  days: z.array(z.object({
    day: daySchema,
    sections: z.array(z.object({
      section: sectionSchema,
      recipes: z.array(recipeRefSchema),
      previous: z.array(recipeRefSchema),
    })),
  })),
});

export const dietaryRestrictionsSchema = z.object({
  ingredients: z.array(recipeRefSchema.pick({ id: true }).extend({ name: z.string() })),
  groups: z.array(recipeRefSchema.pick({ id: true }).extend({ name: z.string() })),
});

export const mealDayInputSchema = z.object({
  day: daySchema,
  breakfast: z.array(z.string()),
  lunch: z.array(z.string()),
  dinner: z.array(z.string()),
  others: z.array(z.string()),
});

export type MealPlan = z.output<typeof mealPlanSchema>;
export type MealPlanProposal = z.output<typeof proposalSchema>;
export type DietaryRestrictions = z.output<typeof dietaryRestrictionsSchema>;
export type MealDayInput = z.input<typeof mealDayInputSchema>;
