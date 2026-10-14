import { isAxiosError } from 'axios';
import { z } from 'zod';

const apiErrorBodySchema = z.object({
  statusCode: z.number(),
  code: z.string().optional(),
  email: z.string().email().optional(),
  message: z.union([z.string(), z.array(z.string())]),
});

export class ApiError extends Error {
  readonly name = 'ApiError';

  constructor(
    readonly status: number | null,
    readonly code: string | undefined,
    message: string,
    readonly email?: string
  ) {
    super(message);
  }
}

export function toApiError(error: unknown): Error {
  if (!isAxiosError(error)) {
    return error instanceof Error ? error : new Error('Unknown request error');
  }

  const body = apiErrorBodySchema.safeParse(error.response?.data);
  const message = body.success
    ? [body.data.message].flat().join('; ')
    : error.response?.statusText || error.message;

  return new ApiError(
    error.response?.status ?? null,
    body.success ? body.data.code : undefined,
    message,
    body.success ? body.data.email : undefined
  );
}
