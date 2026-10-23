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

export function proposalHasChanges(proposal: MealPlanProposal) {
  return proposal.days.some(({ sections }) => sections.some(({ recipes, previous }) =>
    !sameIds(recipes.map(({ id }) => id), previous.map(({ id }) => id))));
}

function sameIds(left: string[], right: string[]) {
  return left.length === right.length && left.every((id, index) => id === right[index]);
}

/** PUT replaces a whole day; preserve every unchanged section from a fresh GET. */
export function changedDayInputs(proposal: MealPlanProposal, current: MealPlan): MealDayInput[] {
  return proposal.days.flatMap(({ day, sections }) => {
    const saved = current.days.find((item) => item.day === day);
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
  sections: { section: MealSection; recipes: { id: string; title: string }[] }[];
};

export function displayDays(plan?: MealPlan, proposal?: MealPlanProposal | null): DisplayDay[] {
  const byDay = new Map<Weekday, Map<MealSection, { id: string; title: string }[]>>();
  for (const day of plan?.days ?? []) {
    byDay.set(day.day, new Map(day.sections.map((section) => [section.section, section.recipes])));
  }
  for (const day of proposal?.days ?? []) {
    const sections = byDay.get(day.day) ?? new Map<MealSection, { id: string; title: string }[]>();
    for (const section of day.sections) {
      if (!sameIds(section.recipes.map(({ id }) => id), section.previous.map(({ id }) => id)) || !plan) {
        sections.set(section.section, section.recipes);
      }
    }
    byDay.set(day.day, sections);
  }
  return weekdays.filter((day) => byDay.has(day)).map((day) => ({
    day,
    sections: mealSections.map((section) => ({ section, recipes: byDay.get(day)?.get(section) ?? [] })),
  }));
}
