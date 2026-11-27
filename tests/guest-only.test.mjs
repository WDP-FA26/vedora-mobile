import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { mock, test } from 'node:test';
import ts from 'typescript';

const componentUrl = new URL('../src/features/auth/components/guest-only.tsx', import.meta.url).href;
const storeUrl = new URL('../src/shared/stores/session-store.ts', import.meta.url).href;
const returnToUrl = new URL('../src/features/auth/utils/return-to.ts', import.meta.url).href;
registerHooks({
  resolve(specifier, context, next) {
    if (specifier === '@/shared/stores/session-store') return { url: storeUrl, shortCircuit: true };
    if (specifier === '../utils/return-to' && context.parentURL === componentUrl) return { url: returnToUrl, shortCircuit: true };
    return next(specifier, context);
  },
  load(url, context, next) {
    if (url === componentUrl || url === returnToUrl) {
      return { format: 'module', shortCircuit: true, source: ts.transpileModule(readFileSync(new URL(url), 'utf8'), {
        compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.ESNext },
      }).outputText };
    }
    return next(url, context);
  },
});

let session = { accessToken: null, refreshToken: null };
let returnTo;
mock.module(storeUrl, { namedExports: { useSessionStore: select => select(session) } });
mock.module('expo-router', { namedExports: { Redirect: 'Redirect', useLocalSearchParams: () => ({ returnTo }) } });
mock.module('react/jsx-runtime', { namedExports: { jsx: (type, props) => ({ type, props }) } });
const { GuestOnly } = await import(componentUrl);
const form = { type: 'LoginScreen' };

test('signed-out users can open the login form', () => {
  session = { accessToken: null, refreshToken: null };
  assert.equal(GuestOnly({ children: form }), form);
});

test('a restored refresh token without an access token does not send login back to the feed', () => {
  session = { accessToken: null, refreshToken: 'restored-token' };
  returnTo = '/me';
  assert.equal(GuestOnly({ children: form }), form);
});

test('a recovered session redirects to the validated destination', () => {
  session = { accessToken: 'access-token', refreshToken: 'refresh-token' };
  returnTo = '/me';
  assert.deepEqual(GuestOnly({ children: form }), { type: 'Redirect', props: { href: '/me' } });
  returnTo = 'https://example.com';
  assert.deepEqual(GuestOnly({ children: form }), { type: 'Redirect', props: { href: '/explore' } });
});
