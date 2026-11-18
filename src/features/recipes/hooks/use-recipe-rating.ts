import { useIsMutating, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { ApiError } from '@/shared/api/api-error';
import { useSessionStore } from '@/shared/stores/session-store';

import { recipeRatingKeys } from '../data/recipe-rating.keys';
import { getRecipeRating, setRecipeRating } from '../services/recipe-rating.service';

export function useRecipeRating(id: string) {
  const token = useSessionStore((state) => state.accessToken);
  const client = useQueryClient();
  const mutationKey = recipeRatingKeys.mutation(id);
  const pending = useIsMutating({ mutationKey }) > 0;
  const query = useQuery({
    queryKey: recipeRatingKeys.detail(id, !!token),
    queryFn: ({ signal }) => getRecipeRating(id, !!token, signal),
    retry: false,
  });
  const mutation = useMutation({
    mutationKey,
    mutationFn: (value: number | null) => {
      if (!token || token !== useSessionStore.getState().accessToken) throw new ApiError(401, undefined, 'Session changed');
      return setRecipeRating(id, value);
    },
    retry: false,
    onMutate: async () => {
      await client.cancelQueries({ queryKey: recipeRatingKeys.recipe(id) });
      return token;
    },
    onSuccess: async (result, _value, startedToken) => {
      if (!startedToken || startedToken !== useSessionStore.getState().accessToken) return;
      await client.cancelQueries({ queryKey: recipeRatingKeys.recipe(id) });
      if (!startedToken || startedToken !== useSessionStore.getState().accessToken) return;
      client.setQueryData(recipeRatingKeys.detail(id, true), result);
      const { recipeId, ratingCount, averageRating } = result;
      client.setQueryData(recipeRatingKeys.detail(id, false), { recipeId, ratingCount, averageRating });
    },
    onError: (error, _value, startedToken) => {
      if (startedToken === useSessionStore.getState().accessToken && error instanceof ApiError && error.code === 'RATING_CONFLICT') {
        void client.invalidateQueries({ queryKey: recipeRatingKeys.recipe(id) });
      }
    },
  });
  return { query, mutation, pending, change: (value: number | null) => {
    if (token && !client.isMutating({ mutationKey })) mutation.mutate(value);
  } };
}
