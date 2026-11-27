import { z } from 'zod';

import type { ToolPart } from './planner-trace';

const memoryUpdateSchema = z.object({ section: z.enum(['allergies', 'preferences']), lines: z.array(z.string()) });

export function savedMemoryUpdates(parts: ToolPart[]) {
  return parts.flatMap((part) => {
    if (part.type !== 'tool-updateMemory' || part.state !== 'output-available') return [];
    const result = memoryUpdateSchema.safeParse(part.output);
    return result.success ? [{ id: part.toolCallId, ...result.data }] : [];
  });
}
