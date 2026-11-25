import { z } from 'zod';

const namedRefSchema = z.object({ id: z.string(), name: z.string() });
export const MAX_DIETARY_NOTE_LENGTH = 1000;
const dietaryNoteSchema = z.string().trim().max(MAX_DIETARY_NOTE_LENGTH, 'Mỗi ghi chú tối đa 1.000 ký tự.').nullable().optional();

export const dietaryOptionsSchema = z.object({
  ingredients: z.array(namedRefSchema.extend({ aliases: z.array(z.string()) })),
  groups: z.array(namedRefSchema.extend({ ingredients: z.array(z.string()) })),
});

export const dietaryRestrictionsSchema = z.object({
  ingredients: z.array(namedRefSchema),
  groups: z.array(namedRefSchema),
  allergyNote: dietaryNoteSchema,
  preferenceNote: dietaryNoteSchema,
});

export const dietaryUpdateSchema = z.object({
  groupIds: z.array(z.uuid({ version: 'v4' })).max(50).refine((ids) => new Set(ids).size === ids.length),
  ingredientIds: z.array(z.uuid({ version: 'v4' })).max(200).refine((ids) => new Set(ids).size === ids.length),
  allergyNote: dietaryNoteSchema,
  preferenceNote: dietaryNoteSchema,
});

export type DietaryOptions = z.output<typeof dietaryOptionsSchema>;
export type DietaryRestrictions = z.output<typeof dietaryRestrictionsSchema>;
export type DietaryUpdate = z.input<typeof dietaryUpdateSchema>;
