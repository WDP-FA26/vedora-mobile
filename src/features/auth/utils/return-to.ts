/** Only known in-app destinations may survive the login and email flow. */
export function authReturnTo(value?: string): '/explore' | '/ai' | '/meal-plan' | '/me' | '/dietary-profile' | '/blogs' | '/blogs/new' | '/billing' {
  if (value === '/ai' || value === '/meal-plan' || value === '/me' || value === '/dietary-profile' || value === '/blogs' || value === '/blogs/new' || value === '/billing') return value;
  return '/explore';
}
