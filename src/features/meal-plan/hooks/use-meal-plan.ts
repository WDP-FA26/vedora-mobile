import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSessionStore } from '@/shared/stores/session-store';

import { mealPlanKeys } from '../data/meal-plan.keys';
import { getDietaryRestrictions, getMealPlan, saveMealDays } from '../services/meal-plan.service';
import type { MealDayInput } from '../types/meal-plan.schema';

export function useMealPlan(session: string | null) {
  return useQuery({
    queryKey: mealPlanKeys.plan,
    queryFn: ({ signal }) => getMealPlan(signal),
    enabled: !!session,
  });
}

export function useDietaryRestrictions(session: string | null) {
  return useQuery({
    queryKey: mealPlanKeys.dietary,
    queryFn: ({ signal }) => getDietaryRestrictions(signal),
    enabled: !!session,
  });
}

export function useSaveMealDays(session: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (days: MealDayInput[]) => saveMealDays(days),
    onSuccess: (result) => {
      if (session && useSessionStore.getState().accessToken === session) {
        queryClient.setQueryData(mealPlanKeys.plan, result);
      }
    },
  });
}
