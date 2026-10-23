import { z } from 'zod';

const namedRefSchema = z.object({ id: z.string(), name: z.string() });

export const dietaryOptionsSchema = z.object({
  ingredients: z.array(namedRefSchema.extend({ aliases: z.array(z.string()) })),
  groups: z.array(namedRefSchema.extend({ ingredients: z.array(z.string()) })),
});

export const dietaryRestrictionsSchema = z.object({
  ingredients: z.array(namedRefSchema),
  groups: z.array(namedRefSchema),
});

export const dietaryUpdateSchema = z.object({
  groupIds: z.array(z.string()).refine((ids) => new Set(ids).size === ids.length),
  ingredientIds: z.array(z.string()).max(200).refine((ids) => new Set(ids).size === ids.length),
});

export type DietaryOptions = z.output<typeof dietaryOptionsSchema>;
export type DietaryRestrictions = z.output<typeof dietaryRestrictionsSchema>;
export type DietaryUpdate = z.input<typeof dietaryUpdateSchema>;
