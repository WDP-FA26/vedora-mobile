import { z } from 'zod';

export const biologicalSexes = ['FEMALE', 'MALE', 'OTHER'] as const;
export const activityLevels = ['SEDENTARY', 'LIGHT', 'MODERATE', 'ACTIVE'] as const;
export const nutritionGoals = ['LOSE_WEIGHT', 'MAINTAIN', 'GAIN_WEIGHT'] as const;
export const bmiCategories = ['UNDERWEIGHT', 'NORMAL', 'OVERWEIGHT', 'OBESE'] as const;
export const bodyFeelings = ['ENERGETIC', 'NORMAL', 'TIRED', 'BLOATED'] as const;

export type BiologicalSex = (typeof biologicalSexes)[number];
export type ActivityLevel = (typeof activityLevels)[number];
export type NutritionGoal = (typeof nutritionGoals)[number];
export type BmiCategory = (typeof bmiCategories)[number];
export type BodyFeeling = (typeof bodyFeelings)[number];

const bodyMetricLogSchema = z.object({
  id: z.string(),
  date: z.string(),
  weightKg: z.number(),
  heightCm: z.number(),
  bmi: z.number(),
  feeling: z.enum(bodyFeelings).nullable(),
  note: z.string().nullable(),
});

/** What `GET/PUT /dietary/nutrition` and `POST /dietary/nutrition/check-in` return. */
export const nutritionProfileSchema = z.object({
  heightCm: z.number().nullable(),
  weightKg: z.number().nullable(),
  targetWeightKg: z.number().nullable(),
  birthYear: z.number().nullable(),
  biologicalSex: z.enum(biologicalSexes).nullable(),
  activityLevel: z.enum(activityLevels).nullable(),
  nutritionGoal: z.enum(nutritionGoals).nullable(),
  bmi: z.number().nullable(),
  bmiCategory: z.enum(bmiCategories).nullable(),
  effectiveGoal: z.enum(nutritionGoals).nullable(),
  idealWeightMinKg: z.number().nullable(),
  idealWeightMaxKg: z.number().nullable(),
  dailyCalorieTarget: z.number().nullable(),
  dailyCalorieMin: z.number().nullable(),
  dailyCalorieMax: z.number().nullable(),
  safetyNote: z.string().nullable(),
  history: z.array(bodyMetricLogSchema),
});

// The form rounds to one decimal place before parsing, as the API accepts at most one.
const weight = z.number().min(25).max(300);

/** Body of `PUT /dietary/nutrition`; `null` clears a field. */
export const nutritionInputSchema = z.object({
  heightCm: z.number().int().min(100).max(250).nullable(),
  weightKg: weight.nullable(),
  targetWeightKg: weight.nullable(),
  birthYear: z.number().int().min(1920).max(2020).nullable(),
  biologicalSex: z.enum(biologicalSexes).nullable(),
  activityLevel: z.enum(activityLevels).nullable(),
  nutritionGoal: z.enum(nutritionGoals).nullable(),
});

/** Body of `POST /dietary/nutrition/check-in`; the date defaults to today on the server. */
export const weightCheckInSchema = z.object({
  weightKg: weight,
  feeling: z.enum(bodyFeelings).nullable().optional(),
});

export type NutritionProfile = z.output<typeof nutritionProfileSchema>;
export type NutritionInput = z.input<typeof nutritionInputSchema>;
export type WeightCheckIn = z.input<typeof weightCheckInSchema>;
