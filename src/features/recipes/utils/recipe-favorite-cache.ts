import type { InfiniteData } from '@tanstack/react-query';

import type { Recipe, RecipeDetail } from '../types/recipe.schema';

type RecipePages = InfiniteData<{ items: Recipe[]; meta: { hasNextPage: boolean } }>;

export function updateFavoritePages(data: RecipePages | undefined, id: string, isFavorite: boolean): RecipePages | undefined {
  if (!data) return data;
  return { ...data, pages: data.pages.map((page) => ({ ...page, items: page.items.map((recipe) => recipe.id === id ? { ...recipe, isFavorite } : recipe) })) };
}

export function updateFavoriteDetail(data: RecipeDetail | undefined, id: string, isFavorite: boolean): RecipeDetail | undefined {
  return data?.id === id ? { ...data, isFavorite } : data;
}
