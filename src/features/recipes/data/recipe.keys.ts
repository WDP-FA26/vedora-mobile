import type { RecipeFilters } from '../types/recipe.schema';

export const recipeKeys = {
  all: ['recipes'] as const,
  list: (filters: RecipeFilters) => [...recipeKeys.all, 'list', filters] as const,
  detail: (id: string) => [...recipeKeys.all, 'detail', id] as const,
};
