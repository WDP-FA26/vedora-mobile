import type { MealSection, PlanChange, Weekday } from '../types/meal-plan.schema';

export type VoicePlanHighlight = {
  weekStart: string;
  targets: { day: Weekday; section: MealSection; recipeIds: string[] }[];
};

/** Highlight committed changes only; unchanged dishes in a touched meal stay neutral. */
export function voicePlanHighlight(change: PlanChange, previous: VoicePlanHighlight | null = null): VoicePlanHighlight | null {
  if (!change.applied) return previous;
  const targets = new Map(previous?.weekStart === change.weekStart
    ? previous.targets.map((target) => [`${target.day}:${target.section}`, target] as const) : []);
  let changed = false;
  for (const day of change.days) {
    for (const slot of day.sections) {
      const before = slot.previous.map((recipe) => recipe.id);
      const after = slot.recipes.map((recipe) => recipe.id);
      if (before.length === after.length && before.every((id, index) => id === after[index])) continue;
      changed = true;
      const key = `${day.day}:${slot.section}` as const;
      const added = after.filter((id) => !before.includes(id));
      const reordered = !added.length && before.length === after.length;
      const marked = new Set([...(targets.get(key)?.recipeIds ?? []), ...(reordered ? after : added)]);
      targets.set(key, { day: day.day, section: slot.section, recipeIds: after.filter((id) => marked.has(id)) });
    }
  }
  return changed ? { weekStart: change.weekStart, targets: [...targets.values()] } : previous;
}
