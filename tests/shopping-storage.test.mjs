import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { registerHooks, stripTypeScriptTypes } from 'node:module';
import { mock, test } from 'node:test';
import { fileURLToPath } from 'node:url';

const root = new URL('../src/', import.meta.url);
registerHooks({
  resolve(specifier, context, next) {
    if (specifier.startsWith('@/')) specifier = new URL(specifier.slice(2), root).href;
    if ((specifier.startsWith('file:') || specifier.startsWith('.')) && context.parentURL) {
      const url = new URL(specifier, context.parentURL);
      if (existsSync(fileURLToPath(url) + '.ts')) specifier = url.href + '.ts';
    }
    return next(specifier, context);
  },
  load(url, context, next) {
    if (url.startsWith(root.href) && url.endsWith('.ts')) return { format: 'module', shortCircuit: true, source: stripTypeScriptTypes(readFileSync(fileURLToPath(url), 'utf8'), { mode: 'transform' }) };
    return next(url, context);
  },
});
const files = new Map();
let hold, started = 0, fail = false;
mock.module('expo-file-system', { exports: { Paths: { document: '/documents' }, File: class {
  constructor(directory, name) { this.path = `${directory}/${name}`; }
  async text() { if (!files.has(this.path)) throw new Error('ENOENT'); return files.get(this.path); }
  async write(text) { started++; if (hold) await hold; if (fail) throw new Error('disk full'); files.set(this.path, text); }
} } });
const native = await import('../src/features/meal-plan/services/shopping-preferences.ts');
const web = await import('../src/features/meal-plan/services/shopping-preferences.web.ts');
globalThis.localStorage = { getItem: (key) => files.get(key) ?? null, setItem: (key, value) => files.set(key, value) };

test('native preferences survive reopening and queued writes keep the latest checkbox state', async () => {
  const key = native.shoppingStorageKey('user-a', '2026-11-23');
  assert.deepEqual(await native.readShoppingPreferences(key), { people: 1, checked: [] });
  let release; hold = new Promise((resolve) => { release = resolve; });
  const first = native.writeShoppingPreferences(key, { people: 2, checked: ['tofu:g'] });
  const second = native.writeShoppingPreferences(key, { people: 3, checked: ['tofu:g', 'rice:kg'] });
  const reopened = native.readShoppingPreferences(key);
  await new Promise(setImmediate); assert.equal(started, 1);
  hold = null; release(); await Promise.all([first, second]);
  assert.deepEqual(await reopened, { people: 3, checked: ['tofu:g', 'rice:kg'] });
  assert.deepEqual(await native.readShoppingPreferences(key), { people: 3, checked: ['tofu:g', 'rice:kg'] });
  assert.notEqual(key, native.shoppingStorageKey('user-b', '2026-11-23'));
  assert.notEqual(key, native.shoppingStorageKey('user-a', '2026-11-30'));
  fail = true; await assert.rejects(native.writeShoppingPreferences(key, { people: 1, checked: [] }), /disk full/);
  fail = false; await native.writeShoppingPreferences(key, { people: 4, checked: [] });
  assert.equal((await native.readShoppingPreferences(key)).people, 4);
});

test('web storage validates persisted data and recovers from corrupted preferences', async () => {
  const key = web.shoppingStorageKey('user-a', '2026-11-23');
  assert.equal(key, native.shoppingStorageKey('user-a', '2026-11-23'));
  await web.writeShoppingPreferences(key, { people: 2, checked: ['tofu:g'] });
  assert.deepEqual(await web.readShoppingPreferences(key), { people: 2, checked: ['tofu:g'] });
  files.set(key, '{broken'); assert.deepEqual(await web.readShoppingPreferences(key), { people: 1, checked: [] });
  files.set(key, JSON.stringify({ people: 9, checked: [] })); assert.equal((await web.readShoppingPreferences(key)).people, 1);
});
