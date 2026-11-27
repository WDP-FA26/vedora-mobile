import { create } from 'zustand';
import type { PlannerDraft } from '../types/meal-plan.schema';

type PlannerRequest = PlannerDraft & { token: string };

/** One in-app handoff from the standalone diary; never persist or accept AI actions from a URL. */
export const usePlannerRequestStore = create<{
  request: PlannerRequest | null;
  queue: (request: PlannerRequest) => void;
  clear: () => void;
}>((set) => ({ request: null, queue: (request) => set({ request }), clear: () => set({ request: null }) }));
