export const GOOGLE_CALLBACK = 'vedoramobile://google-callback';

export function googleAuthorizationUrl(raw: string, state: string): string {
  const url = new URL(raw);
  if (url.origin !== 'https://accounts.google.com' || url.pathname !== '/o/oauth2/v2/auth' ||
      url.searchParams.get('state') !== state || url.searchParams.get('code_challenge_method') !== 'S256' ||
      !url.searchParams.get('code_challenge')) {
    throw new Error('Invalid Google authorization');
  }
  url.searchParams.set('state', `mobile.${state}`);
  return url.toString();
}

export function isGoogleCallback(raw: string): boolean {
  try {
    const url = new URL(raw);
    return url.protocol === 'vedoramobile:' && url.hostname === 'google-callback' &&
      !url.port && !url.username && !url.password && (url.pathname === '' || url.pathname === '/');
  } catch { return false; }
}

export function googleCallbackCode(raw: string, state: string, startedAt: number): string {
  if (!isGoogleCallback(raw) || Date.now() - startedAt > 600_000) throw new Error('Expired Google callback');
  const params = new URL(raw).searchParams;
  if (params.getAll('state').length !== 1 || params.get('state') !== `mobile.${state}`) throw new Error('Invalid Google state');
  if (params.has('error')) throw new Error('Google authorization denied');
  const code = params.get('code');
  if (params.getAll('code').length !== 1 || !code || code.length > 2048) throw new Error('Invalid Google code');
  return code;
}
