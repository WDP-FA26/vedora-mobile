import { useState } from 'react';

/**
 * Spinner state for pull-to-refresh that only follows the user's pull. Binding `refreshing` to a query's
 * background refetch (e.g. when a screen regains focus) shows the spinner unasked, and iOS can leave it stuck.
 */
export function usePullToRefresh(refresh: () => Promise<unknown> | void) {
  const [refreshing, setRefreshing] = useState(false);
  async function onRefresh() {
    setRefreshing(true);
    try {
      await refresh();
    } finally {
      setRefreshing(false);
    }
  }
  return { refreshing, onRefresh };
}
