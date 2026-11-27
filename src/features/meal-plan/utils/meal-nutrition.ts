import { nutritionPillars, type NutritionPillar } from '@/features/dietary-profile/types/nutrition-pillar.schema';
import { pillarLabels } from '@/features/dietary-profile/data/nutrition-labels';
import type { NutritionProfile } from '@/features/dietary-profile/types/nutrition.schema';
import type { MealPlan } from '../types/meal-plan.schema';

export function computeDayNutrition(day: MealPlan['days'][number], target?: number | null) {
  const recipes = day.sections.flatMap((section) => section.recipes);
  const calories = recipes.reduce((total, recipe) => total + (recipe.caloriesPerServing ?? 0), 0);
  const unknownCalories = recipes.filter((recipe) => recipe.caloriesPerServing == null).length;
  const filledMainMeals = day.sections.filter((section) => section.section !== 'OTHER' && section.recipes.length > 0).length;
  const pillars = nutritionPillars.filter((pillar) => recipes.some((recipe) => recipe.nutritionPillars?.includes(pillar)));
  const isFullMainDay = filledMainMeals === 3;
  const hints: string[] = [];
  if (isFullMainDay && !pillars.includes('PLANT_PROTEIN')) hints.push('Chưa có món được gắn nhóm đạm thực vật.');
  if (isFullMainDay && unknownCalories === 0 && target && calories < target * 0.75) hints.push('Kcal dự kiến thấp hơn vùng mục tiêu.');
  if (unknownCalories === 0 && target && calories > target * 1.25) hints.push('Kcal dự kiến cao hơn vùng mục tiêu.');
  return { day: day.day, date: day.date, calories, unknownCalories, hasKnownCalories: recipes.length > unknownCalories, hasRecipes: recipes.length > 0, filledMainMeals, isFullMainDay, pillars, hints };
}

export function computeWeekNutrition(plan: MealPlan, nutrition?: NutritionProfile | null) {
  const days = plan.days.map((day) => computeDayNutrition(day, nutrition?.dailyCalorieTarget));
  const planned = days.filter((day) => day.hasRecipes);
  const full = days.filter((day) => day.isFullMainDay);
  const knownFull = full.filter((day) => day.unknownCalories === 0);
  const pillarCounts = Object.fromEntries(nutritionPillars.map((pillar) => [pillar, planned.filter((day) => day.pillars.includes(pillar)).length])) as Record<NutritionPillar, number>;
  return {
    days, plannedDayCount: planned.length, fullDayCount: full.length, completeCalorieDays: knownFull.length,
    averageFullDayCalories: knownFull.length ? Math.round(knownFull.reduce((total, day) => total + day.calories, 0) / knownFull.length) : null,
    totalCalories: planned.reduce((total, day) => total + day.calories, 0),
    unknownCalories: planned.reduce((total, day) => total + day.unknownCalories, 0),
    hasKnownCalories: planned.some((day) => day.hasKnownCalories),
    pillarCounts, missingPillars: planned.length ? nutritionPillars.filter((pillar) => !pillarCounts[pillar]) : [],
  };
}

export function buildBalancePrompt(plan: MealPlan, nutrition?: NutritionProfile | null) {
  const summary = computeWeekNutrition(plan, nutrition);
  const missing = summary.missingPillars.map((pillar) => pillarLabels[pillar].label.toLowerCase());
  const request = !summary.plannedDayCount ? 'Hãy gợi ý thực đơn chay cân đối theo chỉ số BMI và đủ 5 nhóm dưỡng chất chay.'
    : `Nhờ trợ lý nhận xét và cân đối thực đơn theo mục tiêu cân nặng, kcal và 5 nhóm chất chay (Đạm, Xơ, Sắt, Canxi, Béo tốt).${missing.length ? ` Bổ sung nhóm ${missing.join(', ')}.` : ''}`;
  const editable = plan.days.filter((day) => day.editable).map((day) => day.date);
  const scope = !plan.editable || !editable.length ? 'Chỉ nhận xét tuần cũ, không sửa thực đơn hoặc tuần khác.'
    : `Chỉ cân đối các ngày còn được chỉnh ${editable.join(', ')} trong tuần này; giữ nguyên ngày đã qua và tuần khác.`;
  return `Tuần đang xem bắt đầu ${plan.weekStart}, kết thúc ${plan.days.at(-1)?.date}. ${request} ${scope}`;
}
