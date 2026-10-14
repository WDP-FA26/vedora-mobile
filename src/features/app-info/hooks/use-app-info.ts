import { useQuery } from '@tanstack/react-query';

import { APP_INFO_QUERY_KEY } from '../data/app-info.keys';
import { getAppInfo } from '../services/app-info.service';

export function useAppInfo() {
  return useQuery({
    queryKey: APP_INFO_QUERY_KEY,
    queryFn: ({ signal }) => getAppInfo(signal),
  });
}
