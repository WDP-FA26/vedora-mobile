import { z } from 'zod';

export const MAX_VIEW_BATCH = 50;
export const viewedPostIdSchema = z.uuid({ version: 'v4' });
export const postViewsInputSchema = z.object({
  postIds: z.array(viewedPostIdSchema).min(1).max(MAX_VIEW_BATCH),
}).strict();
