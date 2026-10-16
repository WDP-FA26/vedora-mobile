/** Only known in-app destinations may survive the login and email flow. */
export function authReturnTo(value?: string): '/explore' | '/ai' | '/meal-plan' | '/me' | '/dietary-profile' {
  if (value === '/ai' || value === '/meal-plan' || value === '/me' || value === '/dietary-profile') return value;
  return '/explore';
}
