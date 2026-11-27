import { z } from 'zod';

import { requestJson } from '@/shared/api/request-json';

import { MAX_RECIPE_QUERY_LENGTH, recipeCategoryPageSchema, recipeDetailSchema, recipeFavoriteStateSchema, recipePageSchema, recipeTagSchema, type RecipeFilters } from '../types/recipe.schema';

const PAGE_SIZE = 12;

export function getRecipePage({ filters, page, signal }: { filters: RecipeFilters; page: number; signal?: AbortSignal }) {
  const q = filters.q.trim().slice(0, MAX_RECIPE_QUERY_LENGTH);
  return requestJson(recipePageSchema, {
    method: 'GET',
    url: '/recipes',
    params: { page, limit: PAGE_SIZE, ...(q ? { q } : {}), ...(filters.tag ? { tag: recipeTagSchema.parse(filters.tag) } : {}), ...(filters.suitableForMe ? { suitableForMe: true } : {}) },
    signal,
  });
}

export async function getRecipeCategories(signal?: AbortSignal) {
  const items: z.output<typeof recipeCategoryPageSchema>['items'] = [];
  // The backend caps the catalogue at 200 categories.
  for (let page = 1; page <= 4; page++) {
    const result = await requestJson(recipeCategoryPageSchema, { method: 'GET', url: '/recipe-categories', params: { page, limit: 50 }, signal });
    items.push(...result.items);
    if (!result.meta.hasNextPage) break;
  }
  return items.filter((item) => !item.hidden).sort((a, b) => a.sortOrder - b.sortOrder);
}

export function getRecipe(id: string, signal?: AbortSignal) {
  return requestJson(recipeDetailSchema, { method: 'GET', url: `/recipes/${id}`, signal });
}

export function getFavoriteRecipePage(page: number, signal?: AbortSignal) {
  return requestJson(recipePageSchema, { method: 'GET', url: '/recipes/favorites', params: { page, limit: PAGE_SIZE }, signal });
}

export async function setRecipeFavorite(id: string, isFavorite: boolean) {
  const recipeId = z.string().uuid().parse(id);
  const result = await requestJson(recipeFavoriteStateSchema, {
    method: isFavorite ? 'PUT' : 'DELETE', url: `/recipes/${recipeId}/favorite`,
  });
  if (result.recipeId !== recipeId) throw new Error('Recipe favorite response mismatch');
  return result;
}
