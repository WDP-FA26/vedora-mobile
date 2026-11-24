import type { NutritionInput, NutritionProfile } from '../types/nutrition.schema';

export type NutritionForm = {
  heightCm: string;
  weightKg: string;
  targetWeightKg: string;
  birthYear: string;
  biologicalSex: NutritionInput['biologicalSex'];
  activityLevel: NutritionInput['activityLevel'];
  nutritionGoal: NutritionInput['nutritionGoal'];
};

const text = (value: number | null) => (value === null ? '' : String(value).replace('.', ','));

export function toForm(profile: NutritionProfile): NutritionForm {
  return {
    heightCm: text(profile.heightCm),
    weightKg: text(profile.weightKg),
    targetWeightKg: text(profile.targetWeightKg),
    birthYear: text(profile.birthYear),
    biologicalSex: profile.biologicalSex,
    activityLevel: profile.activityLevel,
    nutritionGoal: profile.nutritionGoal,
  };
}

/** "72,5" → 72.5; empty → null; not a number → undefined. Rounded to one decimal, the most the API takes. */
export function parseNumber(value: string): number | null | undefined {
  const trimmed = value.trim().replace(',', '.');
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? Math.round(parsed * 10) / 10 : undefined;
}

export function formatKg(value: number) {
  return value.toLocaleString('vi-VN', { maximumFractionDigits: 1 });
}

export function formatShortDate(date: string) {
  return date.slice(5).split('-').reverse().join('/');
}
