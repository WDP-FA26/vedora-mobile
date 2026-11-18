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
    if (url.startsWith(root.href) && url.endsWith('.ts')) return {
      format: 'module', shortCircuit: true, source: stripTypeScriptTypes(readFileSync(fileURLToPath(url), 'utf8'), { mode: 'transform' }),
    };
    return next(url, context);
  },
});
const local = (path) => new URL(path, root).href;
const id = (n) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const listeners = new Set(), requests = [];
let request = async (config) => { requests.push(config); return { status: 204, data: '' }; };
mock.module(local('shared/api/api-client.ts'), { namedExports: { apiClient: { request: (config) => request(config) } } });
mock.module(local('shared/stores/session-store.ts'), { namedExports: { useSessionStore: { subscribe: (fn) => { listeners.add(fn); return () => listeners.delete(fn); } } } });
const { postViewsInputSchema } = await import('../src/features/feed/types/post-view.schema.ts');
const { recordPostViews } = await import('../src/features/feed/services/post-view.service.ts');
const { createPostViewTracker, isPostVisible } = await import('../src/features/feed/hooks/post-view-tracker.ts');

test('views API validates IDs and batch size, sends only postIds and accepts empty HTTP 204', async () => {
  assert.equal(postViewsInputSchema.safeParse({ postIds: [] }).success, false);
  assert.equal(postViewsInputSchema.safeParse({ postIds: ['showcase:1'] }).success, false);
  assert.equal(postViewsInputSchema.safeParse({ postIds: Array.from({ length: 51 }, (_, i) => id(i)) }).success, false);
  const controller = new AbortController();
  await recordPostViews([id(1), id(2)], controller.signal);
  assert.equal(requests.at(-1).method, 'POST');
  assert.equal(requests.at(-1).url, '/posts/views');
  assert.deepEqual(requests.at(-1).data, { postIds: [id(1), id(2)] });
  assert.equal(listeners.size, 0);
  const before = requests.length;
  await assert.rejects(recordPostViews(['invalid']));
  assert.equal(requests.length, before);
});

test('session changes and caller cancellation abort a request rather than replaying views as another account', async () => {
  request = (config) => new Promise((resolve, reject) => config.signal.addEventListener('abort', () => reject(new Error('aborted'))));
  const running = recordPostViews([id(1)]);
  for (const listener of listeners) listener({ accessToken: 'new' }, { accessToken: 'old' });
  await assert.rejects(running, /aborted/);
  assert.equal(listeners.size, 0);
  const controller = new AbortController();
  const cancelled = recordPostViews([id(2)], controller.signal);
  controller.abort(); await assert.rejects(cancelled, /aborted/);
  assert.equal(listeners.size, 0);
});

function setup(t, send) {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const batches = [];
  const tracker = createPostViewTracker(send ?? (async (ids) => { batches.push(ids); }));
  t.after(() => tracker.dispose());
  tracker.setActive(true);
  return { tracker, batches, tick: (ms) => t.mock.timers.tick(ms) };
}

test('fast scrolling and preloaded items do not qualify; uninterrupted one-second visibility does', (t) => {
  const { tracker, batches, tick } = setup(t);
  tracker.update([id(1)]); tick(999); tracker.update([]); tick(4000);
  assert.deepEqual(batches, []);
  tracker.update([id(1), 'demo']); tick(1000); tick(3000);
  assert.deepEqual(batches, [[id(1)]]);
});

test('new visible neighbors do not restart dwell; duplicates are batched and not recounted on rerender', (t) => {
  const { tracker, batches, tick } = setup(t);
  tracker.update([id(1)]); tick(500);
  tracker.update([id(1), id(2), id(1)]); tick(500); tick(500); tick(2500);
  assert.deepEqual(batches, [[id(1), id(2)]]);
  tracker.update([]); tracker.update([id(1), id(2)]); tick(5000);
  assert.equal(batches.length, 1);
});

test('blur/background cancels incomplete dwell and flushes only already qualified views', (t) => {
  const { tracker, batches, tick } = setup(t);
  tracker.update([id(1)]); tick(700); tracker.setActive(false); tick(5000);
  assert.equal(batches.length, 0);
  tracker.setActive(true); tick(999); assert.equal(batches.length, 0);
  tick(1); tracker.setActive(false);
  assert.deepEqual(batches, [[id(1)]]);
});

test('large queues split into at most 50 IDs; reset drops old-session pending views', (t) => {
  const { tracker, batches, tick } = setup(t);
  tracker.update(Array.from({ length: 101 }, (_, i) => id(i))); tick(1000); tick(3000);
  assert.deepEqual(batches.map((batch) => batch.length), [50, 50, 1]);
  tracker.update([id(999)]); tick(1000); tracker.reset(); tracker.update([]); tick(5000);
  assert.equal(batches.length, 3);
});

test('failed batches retry once without an endless retry timer', async (t) => {
  let attempts = 0;
  const { tracker, tick } = setup(t, async () => { attempts++; throw new Error('offline'); });
  tracker.update([id(1)]); tick(1000); tick(3000);
  await Promise.resolve(); await Promise.resolve(); await Promise.resolve();
  assert.equal(attempts, 2);
  tick(10000); assert.equal(attempts, 2);
});

test('reset cancels an in-flight batch from the old session without retrying it', async (t) => {
  let attempts = 0, lastSignal;
  const { tracker, tick } = setup(t, (_ids, signal) => new Promise((_resolve, reject) => {
    attempts++; lastSignal = signal; signal.addEventListener('abort', () => reject(new Error('aborted')));
  }));
  tracker.update([id(1)]); tick(1000); tick(3000);
  tracker.reset(); tracker.update([]);
  assert.equal(lastSignal.aborted, true);
  await Promise.resolve(); tick(5000);
  assert.equal(attempts, 1);
});

test('scroll geometry counts short cards and long articles only after half of item/viewport is visible', () => {
  assert.equal(isPostVisible(800, 200, 0, 600), false);
  assert.equal(isPostVisible(550, 200, 0, 600), false);
  assert.equal(isPostVisible(500, 200, 0, 600), true);
  assert.equal(isPostVisible(0, 3000, 500, 600), true);
  assert.equal(isPostVisible(0, 3000, 2800, 600), false);
  assert.equal(isPostVisible(0, 0, 0, 600), false);
});

let focused = true;
const effects = [], appEvents = new Map();
const appState = { currentState: 'active', addEventListener: (name, callback) => {
  const callbacks = appEvents.get(name) ?? new Set(); callbacks.add(callback); appEvents.set(name, callbacks);
  return { remove: () => callbacks.delete(callback) };
} };
mock.module('expo-router', { namedExports: { useIsFocused: () => focused } });
mock.module('react-native', { namedExports: { AppState: appState, Platform: { OS: 'android' } } });
mock.module('react', { namedExports: {
  useState: (init) => [typeof init === 'function' ? init() : init, () => {}],
  useRef: (current) => ({ current }), useCallback: (callback) => callback,
  useEffect: (effect) => { const cleanup = effect(); if (cleanup) effects.push(cleanup); },
} });
const { usePostViewability } = await import('../src/features/feed/hooks/use-post-views.ts');
function mount(t, enabled = true) {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  request = async (config) => { requests.push(config); return { status: 204, data: '' }; };
  t.after(() => { for (const cleanup of effects.splice(0).reverse()) cleanup(); appEvents.clear(); });
  return usePostViewability((post) => post, enabled);
}
const visiblePost = (n, status = 'PUBLISHED') => ({ item: { id: id(n), status }, isViewable: true });
function appChange(state) {
  appState.currentState = state;
  for (const callback of appEvents.get('change') ?? []) callback(state);
}

test('list hook filters unpublished/demo items and restarts dwell after backgrounding', (t) => {
  focused = true; appState.currentState = 'active';
  const before = requests.length;
  const viewability = mount(t);
  viewability.onViewableItemsChanged({ viewableItems: [visiblePost(10), visiblePost(11, 'DRAFT'), { item: { id: 'demo', status: 'PUBLISHED' }, isViewable: true }] });
  t.mock.timers.tick(700); appChange('background'); t.mock.timers.tick(5000);
  assert.equal(requests.length, before);
  appChange('active'); t.mock.timers.tick(999);
  assert.equal(requests.length, before);
  t.mock.timers.tick(1); t.mock.timers.tick(3000);
  assert.deepEqual(requests.at(-1).data, { postIds: [id(10)] });
});

test('off-screen routes never record preloaded viewable items', (t) => {
  focused = false; appState.currentState = 'active';
  const before = requests.length;
  const viewability = mount(t);
  viewability.onViewableItemsChanged({ viewableItems: [visiblePost(20)] });
  t.mock.timers.tick(10000);
  assert.equal(requests.length, before);
});

test('disabled feed filters never record items from the previous list', (t) => {
  focused = true; appState.currentState = 'active';
  const before = requests.length;
  const viewability = mount(t, false);
  viewability.onViewableItemsChanged({ viewableItems: [visiblePost(30)] });
  t.mock.timers.tick(10000);
  assert.equal(requests.length, before);
});
