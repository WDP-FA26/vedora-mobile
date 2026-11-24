import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { mealLogKeys } from '@/features/meal-log/data/meal-log.keys';
import { useSessionStore } from '@/shared/stores/session-store';

import { dietaryProfileKeys } from '../data/dietary-profile.keys';
import { checkInWeight, getNutrition, saveNutrition } from '../services/nutrition.service';
import type { NutritionProfile } from '../types/nutrition.schema';

export function useNutrition(token: string | null) {
  return useQuery({
    queryKey: dietaryProfileKeys.nutrition,
    queryFn: ({ signal }) => getNutrition(signal),
    enabled: !!token,
  });
}

/** Both writes return the whole profile; the daily kcal target in the meal log depends on it. */
function useNutritionWrite<TInput>(token: string | null, write: (input: TInput) => Promise<NutritionProfile>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: write,
    onSuccess: (result) => {
      if (token && useSessionStore.getState().accessToken === token) {
        queryClient.setQueryData(dietaryProfileKeys.nutrition, result);
        void queryClient.invalidateQueries({ queryKey: mealLogKeys.all });
      }
    },
  });
}

export function useSaveNutrition(token: string | null) {
  return useNutritionWrite(token, saveNutrition);
}

export function useCheckInWeight(token: string | null) {
  return useNutritionWrite(token, checkInWeight);
}
