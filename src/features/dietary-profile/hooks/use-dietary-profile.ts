import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { mealPlanKeys } from '@/features/meal-plan/data/meal-plan.keys';
import { ApiError } from '@/shared/api/api-error';
import { useSessionStore } from '@/shared/stores/session-store';

import { dietaryProfileKeys } from '../data/dietary-profile.keys';
import { getMyDietary, saveMyDietary } from '../services/dietary-profile.service';
import type { DietaryUpdate } from '../types/dietary-profile.schema';

export function useDietaryProfile(token: string | null) {
  const mine = useQuery({
    queryKey: dietaryProfileKeys.mine,
    queryFn: ({ signal }) => getMyDietary(signal),
    enabled: !!token,
  });
  return { mine };
}

export function useSaveDietaryProfile(token: string | null) {
  const queryClient = useQueryClient();
  const assertSession = () => {
    if (!token || useSessionStore.getState().accessToken !== token) throw new ApiError(401, 'SESSION_CHANGED', 'Session changed');
  };
  return useMutation({
    retry: false,
    networkMode: 'always',
    mutationFn: async (values: DietaryUpdate) => {
      assertSession();
      const result = await saveMyDietary(values);
      assertSession();
      return result;
    },
    onSuccess: async (result) => {
      await queryClient.cancelQueries({ queryKey: dietaryProfileKeys.mine });
      assertSession();
      queryClient.setQueryData(dietaryProfileKeys.mine, result);
      void queryClient.invalidateQueries({ queryKey: mealPlanKeys.plan });
    },
  });
}
