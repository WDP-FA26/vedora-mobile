import { useInfiniteQuery, useQuery } from '@tanstack/react-query';

import { recipeKeys } from '../data/recipe.keys';
import { getRecipe, getRecipePage } from '../services/recipe.service';
import type { RecipeFilters } from '../types/recipe.schema';

export function useRecipes(filters: RecipeFilters) {
  return useInfiniteQuery({
    queryKey: recipeKeys.list(filters),
    initialPageParam: 1,
    queryFn: ({ pageParam, signal }) => getRecipePage({ filters, page: pageParam, signal }),
    getNextPageParam: (lastPage, _pages, lastPageParam) => (lastPage.meta.hasNextPage ? lastPageParam + 1 : undefined),
  });
}

export function useRecipe(id: string) {
  return useQuery({
    queryKey: recipeKeys.detail(id),
    queryFn: ({ signal }) => getRecipe(id, signal),
  });
}
