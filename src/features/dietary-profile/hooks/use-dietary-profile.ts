import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { mealPlanKeys } from '@/features/meal-plan/data/meal-plan.keys';
import { useSessionStore } from '@/shared/stores/session-store';

import { dietaryProfileKeys } from '../data/dietary-profile.keys';
import { getDietaryOptions, getMyDietary, saveMyDietary } from '../services/dietary-profile.service';
import type { DietaryUpdate } from '../types/dietary-profile.schema';

export function useDietaryProfile(token: string | null) {
  const options = useQuery({
    queryKey: dietaryProfileKeys.options,
    queryFn: ({ signal }) => getDietaryOptions(signal),
    enabled: !!token,
  });
  const mine = useQuery({
    queryKey: dietaryProfileKeys.mine,
    queryFn: ({ signal }) => getMyDietary(signal),
    enabled: !!token,
  });
  return { options, mine };
}

export function useSaveDietaryProfile(token: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: DietaryUpdate) => saveMyDietary(values),
    onSuccess: (result) => {
      if (token && useSessionStore.getState().accessToken === token) {
        queryClient.setQueryData(dietaryProfileKeys.mine, result);
        queryClient.setQueryData(mealPlanKeys.dietary, result);
        void queryClient.invalidateQueries({ queryKey: mealPlanKeys.plan });
      }
    },
  });
}
