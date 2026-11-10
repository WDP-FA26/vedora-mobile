/** Retain retry keys across screen remounts, scoped to the current session. */
export function createPaymentAttempts() {
  let session: string | null = null;
  const keys = new Map<string, string>();
  return {
    get(scope: string, plan: string) {
      if (scope !== session) { keys.clear(); session = scope; }
      let key = keys.get(plan);
      if (!key) {
        key = `mobile-${Date.now()}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
        keys.set(plan, key);
      }
      return key;
    },
    complete(scope: string, plan: string, key: string) {
      if (session === scope && keys.get(plan) === key) keys.delete(plan);
    },
  };
}
