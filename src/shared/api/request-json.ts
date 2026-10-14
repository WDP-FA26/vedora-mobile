import type { AxiosRequestConfig } from "axios";
import { z } from "zod";

import { apiClient } from "./api-client";

/** Validate an API response before it reaches a Query cache or component. */
export async function requestJson<TSchema extends z.ZodType>(
  schema: TSchema,
  config: AxiosRequestConfig,
): Promise<z.output<TSchema>> {
  const { data } = await apiClient.request<unknown>(config);
  return schema.parse(data);
}
