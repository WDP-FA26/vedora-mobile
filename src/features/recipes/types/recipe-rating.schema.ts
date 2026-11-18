import { z } from 'zod';

export const recipeRatingInputSchema = z.object({ value: z.number().int().min(1).max(5) }).strict();
export const recipeRatingSummarySchema = z.object({
  recipeId: z.uuid(),
  ratingCount: z.number().int().nonnegative(),
  averageRating: z.number().min(1).max(5).nullable(),
});
export const myRecipeRatingSchema = recipeRatingSummarySchema.extend({
  myRating: recipeRatingInputSchema.shape.value.nullable(),
});
