import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { registerHooks, stripTypeScriptTypes } from 'node:module';
import { beforeEach, mock, test } from 'node:test';
import { fileURLToPath } from 'node:url';

const root = new URL('../src/', import.meta.url);
const local = path => new URL(path, root).href;
registerHooks({ resolve(specifier, context, next) {
  if (specifier === 'expo-image-picker') return { url: 'data:text/javascript,export const launchImageLibraryAsync = () => globalThis.__contentPicker();', shortCircuit: true };
  if (specifier.startsWith('@/')) specifier = new URL(specifier.slice(2), root).href;
  if ((specifier.startsWith('file:') || specifier.startsWith('.')) && context.parentURL) {
    const url = new URL(specifier, context.parentURL);
    if (existsSync(fileURLToPath(url) + '.ts')) specifier = url.href + '.ts';
  }
  return next(specifier, context);
}, load(url, context, next) {
  if (url.startsWith(root.href) && url.endsWith('.ts')) return { format: 'module', shortCircuit: true, source: stripTypeScriptTypes(readFileSync(new URL(url), 'utf8'), { mode: 'transform' }) };
  return next(url, context);
} });
let slots, cursor, effects, revision, assets, platform, bytes, failUri, discarded, nextId;
const useRef = initial => { const index = cursor++; return slots[index] ??= { current: initial }; };
const useState = initial => { const index = cursor++; if (!(index in slots)) slots[index] = typeof initial === 'function' ? initial() : initial; return [slots[index], value => { slots[index] = typeof value === 'function' ? value(slots[index]) : value; }]; };
const useEffect = (effect, deps) => {
  const index = cursor++; const old = slots[index];
  if (!old || !deps || deps.some((value, i) => !Object.is(value, old.deps[i]))) effects.push(() => { old?.cleanup?.(); slots[index] = { deps, cleanup: effect() }; });
};
function render(fn) { cursor = 0; effects = []; const result = fn(); effects.forEach(effect => effect()); return result; }
function unmount() { slots.forEach(slot => slot?.cleanup?.()); }
mock.module('react', { exports: { useRef, useState, useEffect } });
mock.module('react-native', { exports: { Platform: { get OS() { return platform; } } } });
mock.module('expo-file-system', { exports: { File: class { size = 1000; } } });
globalThis.__contentPicker = async () => ({ canceled: false, assets });
mock.module(local('shared/session/session-manager.ts'), { exports: { getSessionRevision: () => revision } });
mock.module(local('features/messaging/utils/messaging.ts'), { exports: { createClientMessageId: () => `local-${nextId++}` } });
mock.module(local('features/feed/services/compose.service.ts'), { exports: { uploadVideoToCloudinary: async (video, _target, progress, signal) => {
  bytes.push(video.uri); progress(50);
  assert.equal(signal.aborted, false);
  if (video.uri === failUri) { failUri = null; throw new Error('Mất mạng'); }
  progress(100);
} } });
const { useVideoFiles } = await import('../src/features/feed/hooks/use-video-files.ts');
const { useBlogAutosave } = await import('../src/features/blogs/hooks/use-blog-autosave.ts');
beforeEach(() => { slots = []; cursor = 0; effects = []; revision = 0; assets = []; platform = 'android'; bytes = []; failUri = null; discarded = []; nextId = 1; });
const discard = async id => { discarded.push(id); };
const hook = () => useVideoFiles(discard);
const target = id => ({ id, upload: { url: 'https://upload.test', fields: {}, chunkSize: 10 } });

test('multiple video selection converts native milliseconds, caps count/duration, and leaves previous files intact on rejection', async () => {
  let files = render(hook);
  assets = [{ uri: 'file:first', duration: 30_000 }, { uri: 'file:second', duration: 180_000 }];
  await files.pick(4); files = render(hook);
  assert.deepEqual(files.entries.map(entry => entry.video.durationSeconds), [30, 180]);
  assets = [{ uri: 'file:too-long', duration: 181_000 }];
  await assert.rejects(files.pick(2), /3 phút/);
  assert.equal(render(hook).entries.length, 2);
  assets = [{ uri: 'file:one' }, { uri: 'file:two' }, { uri: 'file:three' }];
  await assert.rejects(files.pick(2), /2 video/);
});

test('web duration is seconds; Blog accepts longer videos within its 100 MB limit', async () => {
  platform = 'web';
  let files = render(hook);
  assets = [{ uri: 'https://local.test/one', duration: 180, fileSize: 1000 }];
  await files.pick(1); files = render(hook);
  assert.equal(files.entries[0].video.durationSeconds, 180);
  files.clear();
  assets = [{ uri: 'https://local.test/blog', duration: 600, fileSize: 100 * 1048576 }];
  await files.pick(1, 100 * 1048576, Infinity);
  files.clear();
  assets[0].fileSize++;
  await assert.rejects(files.pick(1, 100 * 1048576, Infinity), /100 MB/);
});

test('retry skips successful videos, discards an interrupted edit upload, and cleanup never discards committed media', async () => {
  let files = render(hook);
  assets = [{ uri: 'file:a' }, { uri: 'file:b' }];
  await files.pick(4); files = render(hook);
  let id = 0; const prepare = async () => target(`server-${++id}`);
  failUri = 'file:b';
  await assert.rejects(files.uploadAll(prepare), /Mất mạng/);
  assert.deepEqual(bytes, ['file:a', 'file:b']);
  assert.equal(render(hook).entries[0].uploaded, true);
  const ids = await files.uploadAll(prepare);
  assert.deepEqual(ids, ['server-1', 'server-3']);
  assert.deepEqual(bytes, ['file:a', 'file:b', 'file:b']);
  assert.deepEqual(discarded, ['server-2']);
  files.commit(ids); unmount();
  assert.deepEqual(discarded, ['server-2']);
});

test('changing accounts during a signed upload request prevents sending bytes or discarding as the next account', async () => {
  const files = render(hook);
  assets = [{ uri: 'file:a' }]; await files.pick(1);
  let resolve; const pending = files.uploadAll(() => new Promise(done => { resolve = done; }));
  revision++; resolve(target('old-account-media'));
  await assert.rejects(pending, /Phiên làm việc/);
  unmount(); assert.deepEqual(bytes, []); assert.deepEqual(discarded, []);
});

test('Blog autosave debounces edits, serializes while busy, stops on failure, and never autosaves published/locked blogs', () => {
  let timers = new Map(), timerId = 0, saves = 0;
  const oldSet = globalThis.setTimeout, oldClear = globalThis.clearTimeout;
  globalThis.setTimeout = (fn, ms) => { assert.equal(ms, 2500); timers.set(++timerId, fn); return timerId; };
  globalThis.clearTimeout = id => timers.delete(id);
  const props = { title: 'Bếp nhỏ', content: 'Đang gõ', dirty: true, enabled: true, busy: false, status: 'DRAFT', save: async () => { saves++; } };
  const draw = () => render(() => useBlogAutosave(props));
  try {
    draw(); assert.equal(timers.size, 1);
    props.content = 'Gõ tiếp'; draw(); assert.equal(timers.size, 1);
    props.busy = true; draw(); assert.equal(timers.size, 0);
    props.busy = false; draw(); [...timers.values()][0](); timers.clear(); assert.equal(saves, 1);
    props.busy = true; draw(); props.busy = false; draw(); assert.equal(timers.size, 0);
    props.content = 'Nội dung mới'; draw(); assert.equal(timers.size, 1);
    props.status = 'PUBLISHED'; draw(); assert.equal(timers.size, 0);
    props.status = 'REJECTED'; draw(); assert.equal(timers.size, 1);
    props.enabled = false; draw(); assert.equal(timers.size, 0);
    props.enabled = true; draw(); unmount(); assert.equal(timers.size, 0);
  } finally { globalThis.setTimeout = oldSet; globalThis.clearTimeout = oldClear; }
});
