import { z } from 'zod';

import { requestJson } from '@/shared/api/request-json';

import { myRecipeRatingSchema, recipeRatingInputSchema, recipeRatingSummarySchema } from '../types/recipe-rating.schema';

export async function getRecipeRating(id: string, authenticated: boolean, signal?: AbortSignal) {
  const recipeId = z.uuid().parse(id);
  const config = { method: 'GET', url: `/recipes/${recipeId}/${authenticated ? 'rating' : 'ratings/summary'}`, signal };
  const result = authenticated ? await requestJson(myRecipeRatingSchema, config) : await requestJson(recipeRatingSummarySchema, config);
  if (result.recipeId !== recipeId) throw new Error('Recipe rating response mismatch');
  return result;
}

export async function setRecipeRating(id: string, value: number | null) {
  const recipeId = z.uuid().parse(id);
  const result = await requestJson(myRecipeRatingSchema, {
    method: value === null ? 'DELETE' : 'PUT', url: `/recipes/${recipeId}/rating`,
    ...(value === null ? {} : { data: recipeRatingInputSchema.parse({ value }) }),
  });
  if (result.recipeId !== recipeId) throw new Error('Recipe rating response mismatch');
  return result;
}
