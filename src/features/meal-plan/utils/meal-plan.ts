import {
  mealSections,
  weekdays,
  type MealPlan,
  type MealSection,
  type Weekday,
} from '../types/meal-plan.schema';

export const dayLabels: Record<Weekday, string> = {
  MON: 'Thứ Hai', TUE: 'Thứ Ba', WED: 'Thứ Tư', THU: 'Thứ Năm',
  FRI: 'Thứ Sáu', SAT: 'Thứ Bảy', SUN: 'Chủ nhật',
};
export const shortDayLabels: Record<Weekday, string> = {
  MON: 'T2', TUE: 'T3', WED: 'T4', THU: 'T5', FRI: 'T6', SAT: 'T7', SUN: 'CN',
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

/** The calendar always shows the saved server plan, never a local draft. */
export function displayDays(plan?: MealPlan) {
  if (!plan) return [];
  return weekdays.flatMap((day) => {
    const saved = plan.days.find((item) => item.day === day);
    return saved ? [{ ...saved, sections: mealSections.map((section) => ({ section,
      recipes: saved.sections.find((item) => item.section === section)?.recipes ?? [],
    })) }] : [];
  });
}
