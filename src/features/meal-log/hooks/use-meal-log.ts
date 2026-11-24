import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useSessionStore } from '@/shared/stores/session-store';

import { mealLogKeys } from '../data/meal-log.keys';
import { createMealLogEntry, deleteMealLogEntry, estimateCalories, getMealLog } from '../services/meal-log.service';

export function useMealLog(token: string | null, weekStart?: string) {
  return useQuery({
    queryKey: mealLogKeys.week(weekStart),
    queryFn: ({ signal }) => getMealLog(weekStart, signal),
    enabled: !!token,
  });
}

/** Totals, averages and the entry list are all computed by the API, so every write just refetches the weeks. */
function useRefreshAfter<TInput, TResult>(token: string | null, write: (input: TInput) => Promise<TResult>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: write,
    onSuccess: () => {
      if (token && useSessionStore.getState().accessToken === token) void queryClient.invalidateQueries({ queryKey: mealLogKeys.all });
    },
  });
}

export function useAddMealLogEntry(token: string | null) {
  return useRefreshAfter(token, createMealLogEntry);
}

export function useDeleteMealLogEntry(token: string | null) {
  return useRefreshAfter(token, deleteMealLogEntry);
}

export function useEstimateCalories() {
  return useMutation({ mutationFn: ({ name, details, signal }: { name: string; details?: string; signal: AbortSignal }) => estimateCalories({ name, details }, signal) });
}
