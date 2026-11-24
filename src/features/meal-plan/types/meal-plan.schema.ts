import { z } from 'zod';

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

export const proposalSchema = z.object({
  weekStart: weekStartSchema,
  ok: z.boolean(),
  problems: z.array(mealProblemSchema).optional(),
  days: z.array(z.object({
    day: daySchema,
    sections: z.array(z.object({
      section: sectionSchema,
      recipes: z.array(recipeRefSchema),
      previous: z.array(recipeRefSchema),
    })),
  })),
});

export const proposalStatuses = ['staged', 'saved', 'dismissed'] as const;

/** One saved assistant conversation (`GET /meal-plan/chat/threads/:id`), oldest message first. */
export const plannerThreadSchema = z.object({
  id: z.string(),
  proposalStatuses: z.record(z.string(), z.enum(proposalStatuses)),
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
export type PlannerThread = z.output<typeof plannerThreadSchema>;
export type PlannerThreadSummary = z.output<typeof plannerThreadPageSchema>['items'][number];
export type DietaryRestrictions = z.output<typeof dietaryRestrictionsSchema>;
export type MealDayInput = z.input<typeof mealDayInputSchema>;
