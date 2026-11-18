import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSessionStore } from '@/shared/stores/session-store';

import { mealPlanKeys } from '../data/meal-plan.keys';
import { deletePlannerThread, getDietaryRestrictions, getLatestPlannerThread, getMealPlan, getPlannerThreads, saveMealDays } from '../services/meal-plan.service';
import type { MealDayInput } from '../types/meal-plan.schema';

export function useMealPlan(session: string | null, weekStart?: string) {
  return useQuery({
    queryKey: mealPlanKeys.week(weekStart),
    queryFn: ({ signal }) => getMealPlan(weekStart, signal),
    enabled: !!session,
    refetchInterval: 60_000,
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

/** Saved conversations for the history sheet; loads (and refreshes) only while the sheet is open. */
export function usePlannerThreads(session: string | null, open: boolean) {
  return useInfiniteQuery({
    queryKey: mealPlanKeys.plannerThreads,
    queryFn: ({ pageParam, signal }) => getPlannerThreads({ page: pageParam, signal }),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.meta.hasNextPage ? last.meta.page + 1 : undefined),
    enabled: !!session && open,
    staleTime: 0,
  });
}

export function useDeletePlannerThread() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deletePlannerThread,
    onSettled: () => queryClient.invalidateQueries({ queryKey: mealPlanKeys.plannerThreads }),
  });
}

export function useSaveMealDays(session: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    networkMode: 'always',
    mutationFn: ({ weekStart, days }: { weekStart: string; days: MealDayInput[] }) => saveMealDays(weekStart, days),
    onSuccess: (result) => {
      if (session && useSessionStore.getState().accessToken === session) {
        queryClient.setQueryData(mealPlanKeys.week(result.weekStart), result);
        if (result.weekStart === result.currentWeekStart) queryClient.setQueryData(mealPlanKeys.week(), result);
      }
    },
  });
}
