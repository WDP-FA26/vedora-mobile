import { planChangeSchema, type PlanChange } from '../types/meal-plan.schema';

export const PLAN_CHANGE_TOOLS = ['fillSlots', 'editPlan', 'autoBalancePlan', 'verifyMealPlanAllergies'];

/** Old draft outputs must never be presented as saved changes. */
export function savedPlanChanges(tools: { name: string; callId: string; output: unknown }[]): (PlanChange & { id: string })[] {
  return tools.flatMap((tool) => {
    if (!PLAN_CHANGE_TOOLS.includes(tool.name.replace(/^tool-/, ''))) return [];
    const result = planChangeSchema.safeParse(tool.output);
    return result.success && result.data.applied && result.data.days.length
      ? [{ ...result.data, id: tool.callId }] : [];
  });
}
