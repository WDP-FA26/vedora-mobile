import { useEffect } from 'react';
import { plannerDraftSchema } from '../types/meal-plan.schema';
import type { MealPlanner } from './meal-planner-provider';
import { useSessionStore } from '@/shared/stores/session-store';
import { usePlannerRequestStore } from '../stores/planner-request.store';

/** Match web: ask immediately when idle, or fill the composer while another request runs. */
export function usePlannerDraft(planner: MealPlanner) {
  const request = usePlannerRequestStore((state) => state.request);
  const clear = usePlannerRequestStore((state) => state.clear);
  useEffect(() => {
    if (!request || usePlannerRequestStore.getState().request !== request) return;
    if (request.token !== useSessionStore.getState().accessToken) { clear(); return; }
    if (!planner.currentWeekStart) return;
    const parsed = plannerDraftSchema.safeParse(request);
    if (parsed.success && parsed.data.week && planner.weeks.includes(parsed.data.week) && planner.weekStart !== parsed.data.week) {
      planner.changeWeek(parsed.data.week);
      return;
    }
    clear();
    if (!parsed.success || (parsed.data.week && !planner.weeks.includes(parsed.data.week))) {
      planner.setChatError('Chưa mở được yêu cầu cho tuần này. Hãy tải lại thực đơn và thử lại.');
    } else {
      planner.setComposer(parsed.data.draft);
      planner.setFormOpen(false);
      if (!planner.busy) void planner.sendMessage(parsed.data.draft);
    }
  }, [request, planner, clear]);
}
