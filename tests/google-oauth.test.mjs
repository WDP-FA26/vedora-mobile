import assert from 'node:assert/strict';
import test from 'node:test';
import { googleAuthorizationUrl, googleCallbackCode, isGoogleCallback } from '../src/features/auth/utils/google-oauth.ts';
import { googleAuthorizationSchema } from '../src/features/auth/types/google.schema.ts';

const state = 'a'.repeat(43);
const url = `https://accounts.google.com/o/oauth2/v2/auth?state=${state}&code_challenge_method=S256&code_challenge=challenge&redirect_uri=https%3A%2F%2Fexample.com%2Fauth%2Fgoogle`;
const callback = `vedoramobile://google-callback?state=mobile.${state}&code=one-time-code`;

test('preserves backend callback and PKCE while marking mobile state', () => {
  const result = new URL(googleAuthorizationUrl(url, state));
  assert.equal(result.searchParams.get('state'), `mobile.${state}`);
  assert.equal(result.searchParams.get('redirect_uri'), 'https://example.com/auth/google');
  assert.equal(result.searchParams.get('code_challenge'), 'challenge');
  assert.throws(() => googleAuthorizationUrl(url.replace('accounts.google.com', 'attacker.example'), state));
  assert.throws(() => googleAuthorizationUrl(url, 'other-state'));
  assert.throws(() => googleAuthorizationUrl(url.replace('S256', 'plain'), state));
});

test('only accepts matching, fresh callbacks containing exactly one code and state', () => {
  assert.equal(googleCallbackCode(callback, state, Date.now()), 'one-time-code');
  for (const value of [callback.replace('google-callback', 'google-callback.evil'), callback.replace('vedoramobile:', 'https:'), callback + '&state=other', callback + '&code=other', callback + '&error=access_denied', callback.replace('one-time-code', '')]) {
    assert.throws(() => googleCallbackCode(value, state, Date.now()));
  }
  assert.throws(() => googleCallbackCode(callback, 'another', Date.now()));
  assert.throws(() => googleCallbackCode(callback, state, Date.now() - 600_001));
  assert.equal(isGoogleCallback('not a url'), false);
  assert.equal(isGoogleCallback('vedoramobile://google-callback/other'), false);
});

test('validates backend state and verifier before opening the browser', () => {
  assert.equal(googleAuthorizationSchema.safeParse({ url, state, codeVerifier: 'v'.repeat(43) }).success, true);
  assert.equal(googleAuthorizationSchema.safeParse({ url, state, codeVerifier: 'short' }).success, false);
});
