import { z } from 'zod';

const namedRefSchema = z.object({ id: z.string(), name: z.string() });

const recipeConflictSchema = z.object({
  ruleId: z.string(),
  a: namedRefSchema,
  b: namedRefSchema,
  reason: z.string(),
  source: z.string().nullable(),
});

export const recipeSchema = z.object({
  id: z.string(),
  title: z.string(),
  imageUrl: z.string().nullable(),
  servings: z.number(),
  prepMinutes: z.number().nullable(),
  cookMinutes: z.number().nullable(),
  totalMinutes: z.number().nullable().optional(),
  ingredientCount: z.number(),
  conflicts: z.array(recipeConflictSchema),
  post: z.object({
    id: z.string(),
    author: z.object({ username: z.string(), fullName: z.string() }),
  }).nullable(),
  updatedAt: z.string(),
});

export const recipePageSchema = z.object({
  items: z.array(recipeSchema),
  meta: z.object({ hasNextPage: z.boolean() }),
});

export const recipeDetailSchema = recipeSchema.extend({
  description: z.string().nullable(),
  steps: z.array(z.string()),
  ingredients: z.array(z.object({
    ingredientId: z.string(),
    name: z.string(),
    quantity: z.number().nullable(),
    unit: z.string().nullable(),
    note: z.string().nullable(),
  })),
});

export const MAX_RECIPE_QUERY_LENGTH = 100;

export type Recipe = z.output<typeof recipeSchema>;
export type RecipeDetail = z.output<typeof recipeDetailSchema>;
export type RecipeFilters = { q: string; suitableForMe: boolean };
