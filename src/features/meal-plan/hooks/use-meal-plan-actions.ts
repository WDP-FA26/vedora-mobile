import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { ZodError } from 'zod';

import { ApiError } from '@/shared/api/api-error';
import { useSessionStore } from '@/shared/stores/session-store';

import { mealPlanKeys } from '../data/meal-plan.keys';
import { generateMeals, saveMealDays } from '../services/meal-edit.service';
import { getMealPlan } from '../services/meal-plan.service';
import type { GenerateMeals } from '../types/meal-edit.schema';
import type { MealPlan } from '../types/meal-plan.schema';
import { assertUndoCurrent, editChanges, generatedChanges, inputsForChanges, undoFor, type MealEdit, type SlotChange } from '../utils/meal-edit';

type Undo = { weekStart: string; previous: SlotChange[]; applied: SlotChange[] };
type Action = { kind: 'edit'; edit: MealEdit } | { kind: 'generate'; input: GenerateMeals } | { kind: 'undo'; undo: Undo };

function failureMessage(error: unknown) {
  if (error instanceof ZodError) return 'Dữ liệu thực đơn chưa hợp lệ. Hãy tải lại trước khi thử lại.';
  if (error instanceof ApiError) {
    if (error.code === 'MEAL_DAY_LOCKED') return 'Ngày đã qua chỉ có thể xem lại. Hãy chọn ngày khác.';
    if (error.code === 'MEAL_WEEK_OUT_OF_RANGE') return 'Tuần này nằm ngoài khoảng được phép chỉnh sửa.';
    if (error.code === 'MEAL_PLAN_INVALID') return 'Không lưu được vì có món hoặc nguyên liệu không phù hợp với hồ sơ ăn uống.';
    return 'Chưa xác nhận được kết quả lưu. Hãy tải lại thực đơn trước khi thử lại.';
  }
  return error instanceof Error ? error.message : 'Chưa lưu được thực đơn. Hãy thử lại.';
}

export function useMealPlanActions(token: string | null, plan: MealPlan | undefined, blocked: boolean) {
  const client = useQueryClient();
  const [undo, setUndo] = useState<Undo | null>(null);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [feedbackScope, setFeedbackScope] = useState<{ token: string | null; weekStart?: string }>({ token, weekStart: plan?.weekStart });
  const lock = useRef(false);
  const controller = useRef<AbortController | null>(null);
  useEffect(() => () => controller.current?.abort(), [token]);
  const sameScope = feedbackScope.token === token && feedbackScope.weekStart === plan?.weekStart;
  const mutation = useMutation({
    retry: false,
    mutationFn: async (action: Action) => {
      const weekStart = action.kind === 'generate' ? action.input.weekStart : action.kind === 'undo' ? action.undo.weekStart : plan!.weekStart;
      const request = new AbortController();
      controller.current = request;
      const current = () => !request.signal.aborted && !!token && useSessionStore.getState().accessToken === token && !useSessionStore.getState().actor;
      let fresh = await getMealPlan(weekStart, request.signal);
      if (!current()) throw new Error('Phiên làm việc đã thay đổi.');
      let changes: SlotChange[];
      if (action.kind === 'generate') {
        if (!fresh.editable) throw new Error('Tuần này chỉ có thể xem lại.');
        const preview = await generateMeals(action.input, request.signal);
        const latest = await getMealPlan(weekStart, request.signal);
        if (!current()) throw new Error('Phiên làm việc đã thay đổi.');
        changes = generatedChanges(latest, preview, action.input);
        // Other sections of the same day may have changed while generating.
        fresh = latest;
      } else if (action.kind === 'undo') {
        assertUndoCurrent(fresh, action.undo.applied);
        changes = action.undo.previous;
      } else changes = editChanges(fresh, action.edit);
      const previous = undoFor(fresh, changes);
      const days = inputsForChanges(fresh, changes);
      if (!current()) throw new Error('Phiên làm việc đã thay đổi.');
      const saved = await saveMealDays({ weekStart, days }, request.signal);
      if (current()) {
        await client.cancelQueries({ queryKey: mealPlanKeys.plan });
        if (!current()) return;
        client.setQueriesData<MealPlan>({ queryKey: mealPlanKeys.plan }, (cached) => cached?.weekStart === weekStart ? saved : cached);
        setUndo(action.kind === 'undo' ? null : { weekStart, previous, applied: undoFor(saved, changes) });
        setNotice(action.kind === 'undo' ? 'Đã hoàn tác thay đổi.' : action.kind === 'generate' ? 'Đã lên món và lưu thực đơn. Bạn có thể hoàn tác.' : 'Đã lưu thực đơn.');
      }
    },
  });
  async function run(action: Action) {
    if (!token || !plan || blocked || lock.current) return false;
    lock.current = true;
    setFeedbackScope({ token, weekStart: plan.weekStart });
    setError(''); setNotice('');
    try { await mutation.mutateAsync(action); return token === useSessionStore.getState().accessToken; }
    catch (failure) { if (token === useSessionStore.getState().accessToken) setError(failureMessage(failure)); return false; }
    finally {
      lock.current = false;
      if (token === useSessionStore.getState().accessToken) {
        void client.invalidateQueries({ queryKey: mealPlanKeys.plan });
        void client.invalidateQueries({ queryKey: mealPlanKeys.shopping });
        void client.invalidateQueries({ queryKey: ['meal-log'] });
      }
    }
  }
  return { pending: mutation.isPending, error: sameScope ? error : '', notice: sameScope ? notice : '', canUndo: sameScope && !!undo && undo.weekStart === plan?.weekStart,
    edit: (edit: MealEdit) => run({ kind: 'edit', edit }),
    generate: (input: GenerateMeals) => run({ kind: 'generate', input }),
    undo: () => undo ? run({ kind: 'undo', undo }) : Promise.resolve(false),
  };
}
