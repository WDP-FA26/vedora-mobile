/** Only known in-app destinations may survive the login and email flow. */
export function authReturnTo(value?: string): '/explore' | '/ai' | '/meal-plan' {
  if (value === '/ai' || value === '/meal-plan') return value;
  return '/explore';
}
