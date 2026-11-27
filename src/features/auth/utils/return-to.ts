/** Only known in-app destinations may survive the login and email flow. */
export function authReturnTo(value?: string): '/explore' | '/ai' | '/meal-plan' | '/meal-log' | '/me' | '/dietary-profile' | '/blogs' | '/blogs/new' | '/billing' | '/bookmarks' | '/verification' | '/support' | '/restaurants' | '/pages' | `/restaurants/${string}` {
  if (value && /^\/restaurants\/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(value)) return value as `/restaurants/${string}`;
  if (value === '/restaurants' || value === '/pages' || value === '/support') return value;
  if (value === '/verification' || value === '/bookmarks' || value === '/ai' || value === '/meal-plan' || value === '/meal-log' || value === '/me' || value === '/dietary-profile' || value === '/blogs' || value === '/blogs/new' || value === '/billing') return value;
  return '/explore';
}
