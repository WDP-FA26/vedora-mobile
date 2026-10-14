import { requestJson } from '@/shared/api/request-json';

import { appInfoSchema } from '../types/app-info.schema';

export function getAppInfo(signal?: AbortSignal) {
  return requestJson(appInfoSchema, { method: 'GET', url: '/', signal });
}
