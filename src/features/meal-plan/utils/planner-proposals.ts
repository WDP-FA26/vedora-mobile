import { proposalSchema, type MealPlanProposal } from '../types/meal-plan.schema';

export type PlannerProposal = MealPlanProposal & { id: string };

/** A tool output is the whole draft of its week, so keep its last successful version. */
export function plannerProposals(tools: { name: string; callId: string; output: unknown }[]): PlannerProposal[] {
  const weeks = new Map<string, PlannerProposal>();
  for (const tool of tools) {
    if (!['fillSlots', 'editDraft', 'proposeMealPlan'].includes(tool.name.replace(/^tool-/, ''))) continue;
    const output = proposalSchema.safeParse(tool.output);
    if (!output.success || !output.data.ok) continue;
    weeks.delete(output.data.weekStart);
    weeks.set(output.data.weekStart, { ...output.data, id: tool.callId });
  }
  return [...weeks.values()];
}

export function latestProposalIds(turns: { proposals?: PlannerProposal[] }[]) {
  return Object.fromEntries(turns.flatMap((turn) => turn.proposals?.map((proposal) => [proposal.weekStart, proposal.id]) ?? []));
}
