import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSessionStore } from '@/shared/stores/session-store';

import { mealPlanKeys } from '../data/meal-plan.keys';
import { getDietaryRestrictions, getLatestPlannerThread, getMealPlan, saveMealDays } from '../services/meal-plan.service';
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

/** The saved conversation to reopen when the assistant tab loads; read once per session. */
export function useLatestPlannerThread(session: string | null) {
  return useQuery({
    queryKey: mealPlanKeys.plannerThread,
    queryFn: ({ signal }) => getLatestPlannerThread(signal),
    enabled: !!session,
    staleTime: Infinity,
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
