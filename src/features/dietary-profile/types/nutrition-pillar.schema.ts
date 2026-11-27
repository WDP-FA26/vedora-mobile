import { z } from 'zod';

export const nutritionPillars = ['PLANT_PROTEIN', 'FIBER_VEG', 'HEALTHY_FAT', 'IRON_RICH', 'CALCIUM_RICH'] as const;
export const nutritionPillarSchema = z.enum(nutritionPillars);
export const recipeNutritionFields = {
  caloriesPerServing: z.number().nonnegative().nullable().optional(),
  nutritionPillars: z.array(nutritionPillarSchema).optional(),
};
export type NutritionPillar = z.output<typeof nutritionPillarSchema>;
