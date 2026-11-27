import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { registerHooks, stripTypeScriptTypes } from 'node:module';
import { mock, test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { ZodError } from 'zod';

const sourceRoot = new URL('../src/', import.meta.url);
registerHooks({
  resolve(specifier, context, next) {
    if (specifier === 'react-native')
      return {
        url: 'data:text/javascript,export const Platform={OS:"web"}',
        shortCircuit: true,
      };
    if (specifier.startsWith('@/'))
      specifier = new URL(specifier.slice(2), sourceRoot).href;
    if (
      (specifier.startsWith('file:') || specifier.startsWith('.')) &&
      context.parentURL
    ) {
      const url = new URL(specifier, context.parentURL);
      if (existsSync(fileURLToPath(url) + '.ts')) specifier = url.href + '.ts';
    }
    return next(specifier, context);
  },
  load(url, context, next) {
    if (url.startsWith(sourceRoot.href) && url.endsWith('.ts'))
      return {
        format: 'module',
        shortCircuit: true,
        source: stripTypeScriptTypes(readFileSync(fileURLToPath(url), 'utf8'), {
          mode: 'transform',
        }),
      };
    return next(url, context);
  },
});
let state = {
  accessToken: null,
  refreshToken: null,
  accessTokenExpiresAt: null,
  actor: null,
  setSession(session) {
    Object.assign(state, session);
  },
  clearSession() {
    Object.assign(state, {
      accessToken: null,
      refreshToken: null,
      accessTokenExpiresAt: null,
      actor: null,
      userId: null,
    });
  },
};
let stored = null;
mock.module(new URL('shared/stores/session-store.ts', sourceRoot).href, {
  namedExports: { useSessionStore: { getState: () => state } },
});
mock.module(
  new URL('shared/session/refresh-token-storage.ts', sourceRoot).href,
  {
    namedExports: {
      saveRefreshToken: async (token) => {
        stored = token;
      },
      deleteRefreshToken: async () => {
        stored = null;
      },
      readRefreshToken: async () => stored,
    },
  }
);
const {
  acceptSession,
  clearSession,
  refreshSession,
  registerRefreshRequest,
  switchSession,
} = await import('../src/shared/session/session-manager.ts');
const { authResponseSchema } =
  await import('../src/shared/types/auth-response.ts');
const personId = '9ad64a35-cead-483b-8322-a0c9aaf26c32';
const pageId = '9ad64a35-cead-483b-8322-a0c9aaf26c33';
function session(name, page = false) {
  return authResponseSchema.parse({
    accessToken: name,
    refreshToken: `${name}-refresh`,
    accessTokenExpiresIn: 3600,
    refreshTokenExpiresIn: 86400,
    tokenType: 'Bearer',
    user: {
      id: page ? pageId : personId,
      username: name,
      fullName: name,
      email: page ? 'page@pages.vedora.invalid' : 'an@example.com',
      role: 'USER',
      createdAt: '',
      updatedAt: '',
    },
    actor: page
      ? { id: personId, username: 'an', fullName: 'An', avatarUrl: null }
      : null,
  });
}
const deferred = () => {
  let resolve, reject;
  const promise = new Promise((a, b) => {
    resolve = a;
    reject = b;
  });
  return { promise, resolve, reject };
};
const tick = () => new Promise((resolve) => setImmediate(resolve));

test('switch stores actor and page identity and serializes refresh until the switch finishes', async () => {
  await acceptSession(session('personal'));
  const gate = deferred();
  let count = 0;
  const switching = switchSession(async (refresh, access) => {
    count++;
    assert.equal(refresh, 'personal-refresh');
    assert.equal(access, 'personal');
    return gate.promise;
  });
  const duplicate = switchSession(() => {
    throw new Error('must not run');
  });
  assert.equal(duplicate, switching);
  const refresh = refreshSession();
  gate.resolve(session('restaurant', true));
  await switching;
  assert.equal(await refresh, 'restaurant');
  assert.equal(count, 1);
  assert.equal(state.userId, pageId);
  assert.equal(state.actor.id, personId);
  assert.equal(stored, 'restaurant-refresh');
  await switchSession(async (refresh) => {
    assert.equal(refresh, 'restaurant-refresh');
    return session('personal-again');
  });
  assert.equal(state.actor, null);
  assert.equal(state.userId, personId);
});
test('a pending refresh completes first, then switching uses the rotated refresh token', async () => {
  await acceptSession(session('old'));
  const gate = deferred();
  registerRefreshRequest(() => gate.promise);
  const refreshing = refreshSession();
  let sent;
  const switching = switchSession(async (refresh) => {
    sent = refresh;
    return session('page', true);
  });
  gate.resolve(session('rotated'));
  await refreshing;
  await switching;
  assert.equal(sent, 'rotated-refresh');
  assert.equal(state.accessToken, 'page');
});
test('a sign-out supersedes a switch response and cannot resurrect the page session', async () => {
  await acceptSession(session('old'));
  const gate = deferred();
  const switching = switchSession(() => gate.promise);
  await clearSession();
  gate.resolve(session('late-page', true));
  await assert.rejects(switching, /Session changed/);
  assert.equal(state.accessToken, null);
  assert.equal(stored, null);
});
test('session revision stays stable across rotation and changes when identity is switched', async () => {
  const { getSessionRevision } =
    await import('../src/shared/session/session-manager.ts');
  await acceptSession(session('stable'));
  const revision = getSessionRevision();
  registerRefreshRequest(async () => session('stable-rotated'));
  await refreshSession();
  assert.equal(getSessionRevision(), revision);
  await switchSession(async () => session('page', true));
  assert.notEqual(getSessionRevision(), revision);
});
test('invalid switch response clears the revoked old session; denied switch leaves it usable', async () => {
  await acceptSession(session('old'));
  await assert.rejects(
    switchSession(async () => {
      throw new ZodError([]);
    })
  );
  assert.equal(state.accessToken, null);
  await tick();
  await acceptSession(session('valid'));
  await assert.rejects(
    switchSession(async () => {
      throw new Error('Denied');
    }),
    /Denied/
  );
  assert.equal(state.accessToken, 'valid');
});
