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

// Notes are left out on purpose: the API keeps the saved allergy/preference note when they are omitted.
export const dietaryUpdateSchema = z.object({
  groupIds: z.array(z.uuid({ version: 'v4' })).max(50).refine((ids) => new Set(ids).size === ids.length),
  ingredientIds: z.array(z.uuid({ version: 'v4' })).max(200).refine((ids) => new Set(ids).size === ids.length),
});

export type DietaryOptions = z.output<typeof dietaryOptionsSchema>;
export type DietaryRestrictions = z.output<typeof dietaryRestrictionsSchema>;
export type DietaryUpdate = z.input<typeof dietaryUpdateSchema>;
