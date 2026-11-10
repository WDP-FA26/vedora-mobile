import { useInfiniteQuery, useIsMutating, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useSessionStore } from '@/shared/stores/session-store';

import { recipeKeys } from '../data/recipe.keys';
import { getFavoriteRecipePage, getRecipe, getRecipePage, setRecipeFavorite } from '../services/recipe.service';
import type { RecipeFilters } from '../types/recipe.schema';
import { updateFavoriteDetail, updateFavoritePages } from '../utils/recipe-favorite-cache';

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

export function useFavoriteRecipes() {
  const token = useSessionStore((state) => state.accessToken);
  return useInfiniteQuery({
    queryKey: recipeKeys.favorites,
    initialPageParam: 1,
    queryFn: ({ pageParam, signal }) => getFavoriteRecipePage(pageParam, signal),
    getNextPageParam: (lastPage, _pages, lastPageParam) => lastPage.meta.hasNextPage ? lastPageParam + 1 : undefined,
    enabled: !!token,
  });
}

export function useRecipeFavorite(id: string) {
  const client = useQueryClient();
  const mutationKey = recipeKeys.favoriteMutation(id);
  const pending = useIsMutating({ mutationKey }) > 0;
  const mutation = useMutation({
    mutationKey,
    mutationFn: (isFavorite: boolean) => setRecipeFavorite(id, isFavorite),
    retry: false,
    onMutate: () => useSessionStore.getState().accessToken,
    onSuccess: async ({ recipeId, isFavorite }, _variables, startedToken) => {
      await client.cancelQueries({ queryKey: recipeKeys.all });
      if (startedToken !== useSessionStore.getState().accessToken) return;
      client.setQueryData(recipeKeys.detail(recipeId), (data: Parameters<typeof updateFavoriteDetail>[0]) => updateFavoriteDetail(data, recipeId, isFavorite));
      for (const key of [['recipes', 'list'], recipeKeys.favorites]) {
        client.setQueriesData({ queryKey: key }, (data: Parameters<typeof updateFavoritePages>[0]) => updateFavoritePages(data, recipeId, isFavorite));
      }
    },
    onSettled: () => client.invalidateQueries({ queryKey: recipeKeys.all }),
  });
  return { ...mutation, pending, toggle: (saved: boolean) => {
    if (!client.isMutating({ mutationKey })) mutation.mutate(!saved);
  } };
}
