/** Only known in-app destinations may survive the login and email flow. */
export function authReturnTo(value?: string): '/explore' | '/ai' | '/meal-plan' | '/meal-log' | '/me' | '/dietary-profile' | '/blogs' | '/blogs/new' | '/billing' | '/bookmarks' | '/verification' {
  if (value === '/verification' || value === '/bookmarks' || value === '/ai' || value === '/meal-plan' || value === '/meal-log' || value === '/me' || value === '/dietary-profile' || value === '/blogs' || value === '/blogs/new' || value === '/billing') return value;
  return '/explore';
}
