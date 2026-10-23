import { requestJson } from '@/shared/api/request-json';

import { MAX_RECIPE_QUERY_LENGTH, recipeDetailSchema, recipePageSchema, type RecipeFilters } from '../types/recipe.schema';

const PAGE_SIZE = 12;

export function getRecipePage({ filters, page, signal }: { filters: RecipeFilters; page: number; signal?: AbortSignal }) {
  const q = filters.q.trim().slice(0, MAX_RECIPE_QUERY_LENGTH);
  return requestJson(recipePageSchema, {
    method: 'GET',
    url: '/recipes',
    params: { page, limit: PAGE_SIZE, ...(q ? { q } : {}), ...(filters.suitableForMe ? { suitableForMe: true } : {}) },
    signal,
  });
}

export function getRecipe(id: string, signal?: AbortSignal) {
  return requestJson(recipeDetailSchema, { method: 'GET', url: `/recipes/${id}`, signal });
}
