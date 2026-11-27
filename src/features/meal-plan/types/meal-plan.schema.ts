import { z } from 'zod';
import { recipeNutritionFields } from '@/features/dietary-profile/types/nutrition-pillar.schema';

export const weekdays = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'] as const;
export const mealSections = ['BREAKFAST', 'LUNCH', 'DINNER', 'OTHER'] as const;
export type Weekday = (typeof weekdays)[number];
export type MealSection = (typeof mealSections)[number];

const daySchema = z.enum(weekdays);
const sectionSchema = z.enum(mealSections);
const recipeRefSchema = z.object({ id: z.string(), title: z.string() });
export const calendarDateSchema = z.iso.date();
export const weekStartSchema = calendarDateSchema.refine((date) => new Date(`${date}T00:00:00Z`).getUTCDay() === 1, 'Tuần phải bắt đầu vào thứ Hai.');

const recipeSchema = recipeRefSchema.extend({
  ...recipeNutritionFields,
  /** HTTPS link to the dish's photo; null when the recipe has none. */
  imageUrl: z.string().nullable().optional(),
  servings: z.number(),
  prepMinutes: z.number().nullable(),
  cookMinutes: z.number().nullable(),
  ingredients: z.array(z.object({
    name: z.string(), quantity: z.number().nullable(), unit: z.string().nullable(), note: z.string().nullable(),
  })),
  steps: z.array(z.string()),
});

const mealProblemSchema = z.object({
  code: z.enum(['UNKNOWN_RECIPE', 'AVOIDED_INGREDIENT', 'DAY_CONFLICT', 'DAY_PASSED']),
  day: daySchema,
  recipes: z.array(z.string()),
  recipeIds: z.array(z.string()).optional(),
  ingredients: z.array(z.string()),
  reason: z.string().nullable(),
});

export const mealPlanSchema = z.object({
  weekStart: weekStartSchema,
  currentWeekStart: weekStartSchema,
  today: calendarDateSchema,
  minWeekStart: weekStartSchema,
  maxWeekStart: weekStartSchema,
  editable: z.boolean(),
  days: z.array(z.object({
    day: daySchema,
    date: calendarDateSchema,
    editable: z.boolean(),
    sections: z.array(z.object({ section: sectionSchema, recipes: z.array(recipeSchema) })),
  })),
  problems: z.array(mealProblemSchema),
});

/** These changes are already saved when `applied` is true. */
export const planChangeSchema = z.object({
  weekStart: weekStartSchema,
  applied: z.boolean(),
  problems: z.array(mealProblemSchema),
  days: z.array(z.object({
    day: daySchema,
    sections: z.array(z.object({
      section: sectionSchema,
      recipes: z.array(recipeRefSchema),
      previous: z.array(recipeRefSchema),
    })),
  })),
});

/** One saved assistant conversation (`GET /meal-plan/chat/threads/:id`), oldest message first. */
export const plannerThreadSchema = z.object({
  id: z.string(),
  messages: z.array(z.object({
    id: z.string(),
    role: z.enum(['user', 'assistant']),
    text: z.string(),
    parts: z.array(z.record(z.string(), z.unknown())),
    metadata: z.object({ refused: z.boolean().optional() }).nullable().optional(),
  })),
});

/** A page of `GET /meal-plan/chat/threads`, most recently used first. */
export const plannerThreadPageSchema = z.object({
  items: z.array(z.object({
    id: z.string(),
    title: z.string(),
    messageCount: z.number(),
    lastMessagePreview: z.string().nullable(),
    lastMessageAt: z.string(),
  })),
  meta: z.object({ page: z.number(), hasNextPage: z.boolean() }),
});

export { dietaryRestrictionsSchema } from '@/features/dietary-profile/types/dietary-profile.schema';

export type MealPlan = z.output<typeof mealPlanSchema>;
export type PlanChange = z.output<typeof planChangeSchema>;
export type PlannerThread = z.output<typeof plannerThreadSchema>;
export type PlannerThreadSummary = z.output<typeof plannerThreadPageSchema>['items'][number];
export type { DietaryRestrictions } from '@/features/dietary-profile/types/dietary-profile.schema';

export const plannerRewindSchema = z.object({
  text: z.string(),
  weeks: z.array(z.object({
    weekStart: weekStartSchema, restored: z.array(daySchema), skipped: z.array(daySchema),
    droppedDishes: z.number().int().nonnegative(),
  })),
});
export type PlannerRewind = z.output<typeof plannerRewindSchema>;

export const plannerQuestionSchema = z.object({
  question: z.string().min(1).max(200), options: z.array(z.string().min(1).max(80)).min(1).max(6),
  multiple: z.boolean().optional(),
});
export const plannerWebRequestSchema = z.object({ reason: z.string().min(1) });
export const plannerAnswerSchema = z.object({ answer: z.string().trim().min(1).max(4000) });
export const plannerWebDecisionSchema = z.object({ approved: z.boolean() });
export const plannerDraftSchema = z.object({ draft: z.string().trim().min(1).max(4000), week: weekStartSchema.optional() });
export type PlannerDraft = z.output<typeof plannerDraftSchema>;
