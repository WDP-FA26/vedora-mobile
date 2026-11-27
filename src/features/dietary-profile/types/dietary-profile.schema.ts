import { z } from 'zod';

export const MAX_MEMORY_ITEMS = 30;
export const MAX_MEMORY_ITEM_LENGTH = 200;

/** Same normalization as BE and web: one fact per line, no blanks or repeats. */
export function memoryLines(text: string): string[] {
  return [...new Set(text.split('\n').map((line) => line.trim()).filter(Boolean))];
}

export const dietaryRestrictionsSchema = z.object({
  allergies: z.array(z.string()),
  preferences: z.array(z.string()),
});

const linesSchema = z.array(z.string().trim())
  .transform((lines) => [...new Set(lines.filter(Boolean))])
  .pipe(z.array(z.string().max(MAX_MEMORY_ITEM_LENGTH, `Mỗi dòng tối đa ${MAX_MEMORY_ITEM_LENGTH} ký tự.`))
    .max(MAX_MEMORY_ITEMS, `Tối đa ${MAX_MEMORY_ITEMS} dòng mỗi mục.`));

export const dietaryUpdateSchema = z.object({
  allergies: linesSchema.optional(),
  preferences: linesSchema.optional(),
}).strict();

const memoryTextSchema = z.string().transform(memoryLines).pipe(linesSchema);
export const dietaryFormSchema = z.object({ allergies: memoryTextSchema, preferences: memoryTextSchema });

export type DietaryRestrictions = z.output<typeof dietaryRestrictionsSchema>;
export type DietaryUpdate = z.input<typeof dietaryUpdateSchema>;
