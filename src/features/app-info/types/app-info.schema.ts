import { z } from 'zod';

export const appInfoSchema = z.object({
  name: z.string(),
  version: z.string(),
  docs: z.string(),
});

export type AppInfo = z.infer<typeof appInfoSchema>;
