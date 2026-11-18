import {
  mealSections,
  weekdays,
  type MealDayInput,
  type MealPlan,
  type MealPlanProposal,
  type MealSection,
  type Weekday,
} from '../types/meal-plan.schema';

export const dayLabels: Record<Weekday, string> = {
  MON: 'Thứ Hai', TUE: 'Thứ Ba', WED: 'Thứ Tư', THU: 'Thứ Năm',
  FRI: 'Thứ Sáu', SAT: 'Thứ Bảy', SUN: 'Chủ nhật',
};
export const sectionLabels: Record<MealSection, string> = {
  BREAKFAST: 'Sáng', LUNCH: 'Trưa', DINNER: 'Tối', OTHER: 'Khác',
};

/** Match server warnings by ID; titles support older responses without recipeIds. */
export function avoidedIngredientsForRecipe(problems: MealPlan['problems'], day: Weekday, recipe: { id: string; title: string }) {
  return [...new Set(problems.filter((problem) => problem.code === 'AVOIDED_INGREDIENT' && problem.day === day &&
    (problem.recipeIds ? problem.recipeIds.includes(recipe.id) : problem.recipes.includes(recipe.title)))
    .flatMap((problem) => problem.ingredients))];
}

export function proposalHasChanges(proposal: MealPlanProposal) {
  return proposal.days.some(({ sections }) => sections.some(({ recipes, previous }) =>
    !sameIds(recipes.map(({ id }) => id), previous.map(({ id }) => id))));
}

function sameIds(left: string[], right: string[]) {
  return left.length === right.length && left.every((id, index) => id === right[index]);
}

/** PUT replaces a whole day; preserve every unchanged section from a fresh GET. */
export function changedDayInputs(proposal: MealPlanProposal, current: MealPlan): MealDayInput[] {
  if (proposal.weekStart !== current.weekStart) throw new Error('Đề xuất và thực đơn không cùng tuần. Hãy tải lại trước khi lưu.');
  return proposal.days.flatMap(({ day, sections }) => {
    const saved = current.days.find((item) => item.day === day);
    if (!current.editable || !saved?.editable) return [];
    const changed = sections.filter(({ recipes, previous }) =>
      !sameIds(recipes.map(({ id }) => id), previous.map(({ id }) => id)));
    if (changed.length === 0) return [];

    for (const { section, previous } of changed) {
      const actual = saved?.sections.find((item) => item.section === section)?.recipes.map(({ id }) => id) ?? [];
      if (!sameIds(actual, previous.map(({ id }) => id))) {
        throw new Error('Thực đơn đã thay đổi. Hãy yêu cầu đề xuất mới trước khi lưu.');
      }
    }

    const ids = (section: MealSection) =>
      changed.find((item) => item.section === section)?.recipes.map(({ id }) => id) ??
      saved?.sections.find((item) => item.section === section)?.recipes.map(({ id }) => id) ?? [];
    return [{ day, breakfast: ids('BREAKFAST'), lunch: ids('LUNCH'), dinner: ids('DINNER'), others: ids('OTHER') }];
  });
}

export type DisplayDay = {
  day: Weekday;
  date: string;
  editable: boolean;
  sections: { section: MealSection; recipes: { id: string; title: string }[] }[];
};

export function displayDays(plan?: MealPlan, proposal?: MealPlanProposal | null): DisplayDay[] {
  if (!plan) return [];
  if (proposal?.weekStart !== plan.weekStart) proposal = null;
  const byDay = new Map<Weekday, Map<MealSection, { id: string; title: string }[]>>();
  for (const day of plan?.days ?? []) {
    byDay.set(day.day, new Map(day.sections.map((section) => [section.section, section.recipes])));
  }
  for (const day of proposal?.days ?? []) {
    if (!plan.days.find((item) => item.day === day.day)?.editable) continue;
    const sections = byDay.get(day.day) ?? new Map<MealSection, { id: string; title: string }[]>();
    for (const section of day.sections) {
      if (!sameIds(section.recipes.map(({ id }) => id), section.previous.map(({ id }) => id))) {
        sections.set(section.section, section.recipes);
      }
    }
    byDay.set(day.day, sections);
  }
  return weekdays.filter((day) => byDay.has(day)).map((day) => ({
    day,
    date: plan.days.find((item) => item.day === day)!.date,
    editable: plan.days.find((item) => item.day === day)!.editable,
    sections: mealSections.map((section) => ({ section, recipes: byDay.get(day)?.get(section) ?? [] })),
  }));
}
