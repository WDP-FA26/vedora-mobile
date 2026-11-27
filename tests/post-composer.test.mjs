import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { registerHooks, stripTypeScriptTypes } from 'node:module';
import { beforeEach, mock, test } from 'node:test';
import { fileURLToPath } from 'node:url';

const root = new URL('../src/', import.meta.url);
const local = path => new URL(path, root).href;
registerHooks({ resolve(specifier, context, next) {
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
let slots, cursor, revision, server, calls, files, fail, changeSession;
const id = n => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const media = n => ({ id: id(n), status: 'PROCESSING' });
const snapshot = () => structuredClone(server);
mock.module('react', { exports: {
  useRef: initial => { const i = cursor++; return slots[i] ??= { current: initial }; },
  useState: initial => { const i = cursor++; if (!(i in slots)) slots[i] = typeof initial === 'function' ? initial() : initial; return [slots[i], next => { slots[i] = typeof next === 'function' ? next(slots[i]) : next; }]; },
} });
mock.module('@tanstack/react-query', { exports: { useQueryClient: () => ({ invalidateQueries: async () => {} }) } });
mock.module(local('shared/session/session-manager.ts'), { exports: { getSessionRevision: () => revision } });
mock.module(local('features/messaging/utils/messaging.ts'), { exports: { createClientMessageId: () => id(99) } });
mock.module(local('features/feed/hooks/use-video-files.ts'), { exports: { useVideoFiles: () => ({
  entries: files, picking: false, commit() {},
  uploadAll: async prepare => {
    const ids = [];
    for (const file of files) {
      if (!file.uploaded) {
        const target = await prepare(file); file.mediaId = target.id;
        calls.push(['bytes', target.id]);
        if (fail === file.id) { fail = null; throw new Error('Mất mạng'); }
        file.uploaded = true;
      }
      ids.push(file.mediaId);
    }
    return ids;
  },
}) } });
mock.module(local('features/feed/services/compose.service.ts'), { exports: {
  createDraft: async (draftId, kind) => { calls.push(['create', draftId, kind]); if (changeSession) revision++; return snapshot(); },
  saveDraft: async (_draftId, input) => {
    calls.push(['save', input]); assert.equal(input.expectedVersion, server.version);
    if (fail === 'save') throw new Error('Xung đột bản nháp');
    Object.assign(server, { ...input, version: server.version + 1 }); return snapshot();
  },
  getDraft: async () => snapshot(),
  removeDraftMedia: async (_draftId, mediaId, version) => { calls.push(['remove', mediaId]); assert.equal(version, server.version); server.version++; server.media = server.media.filter(item => item.id !== mediaId); return snapshot(); },
  requestDraftUpload: async (_draftId, mediaId) => {
    calls.push(['target', mediaId]);
    if (!server.media.some(item => item.id === mediaId)) { server.media.push({ id: mediaId, status: 'PROCESSING' }); server.version++; }
    return { draft: snapshot(), upload: {} };
  },
  publishDraft: async (_draftId, version) => { calls.push(['publish', version]); assert.equal(version, server.version); return { id: server.id, status: 'PROCESSING' }; },
} });
const { usePostComposer } = await import('../src/features/feed/hooks/use-post-composer.ts');
let initial;
function render() { cursor = 0; return usePostComposer(initial); }
beforeEach(() => { slots = []; cursor = 0; revision = 0; server = { id: id(1), body: '', title: '', description: '', version: 0, kind: 'POST', media: [] }; calls = []; files = []; initial = null; fail = null; changeSession = false; });

test('publishes a text-only POST using a private draft and latest expectedVersion', async () => {
  let form = render(); form.setBody('Một bữa chay ngon'); form = render();
  const result = await form.persist(true);
  assert.equal(result.status, 'PROCESSING');
  assert.equal(calls[0][2], 'POST');
  assert.equal(server.body, 'Một bữa chay ngon'); assert.equal(calls.at(-1)[0], 'publish');
  assert.equal(render().dirty, false);
});

test('reopened web drafts keep multiple server videos, remove only the chosen one, and add several new videos', async () => {
  server.media = [media(2), media(3)]; server.body = 'Nháp từ web'; initial = snapshot();
  let form = render(); form.removeMedia(id(2));
  files = [4, 5, 6].map(n => ({ id: id(n), mediaId: null, uploaded: false })); form = render();
  const result = await form.persist(true);
  assert.equal(result.status, 'PROCESSING');
  assert.deepEqual(server.media.map(item => item.id), [id(3), id(4), id(5), id(6)]);
  assert.equal(calls.some(call => call[0] === 'create'), false);
  assert.deepEqual(calls.filter(call => call[0] === 'remove'), [['remove', id(2)]]);
});

test('failed uploads retain the draft/body and retry only unfinished files without a second draft or duplicate attachment', async () => {
  let form = render(); form.setBody('Giữ nội dung khi mất mạng');
  files = [2, 3].map(n => ({ id: id(n), mediaId: null, uploaded: false })); fail = id(3); form = render();
  await form.persist(false); assert.match(render().error, /Mất mạng/); assert.equal(render().dirty, true);
  await render().persist(false);
  assert.deepEqual(server.media.map(item => item.id), [id(2), id(3)]);
  assert.equal(calls.filter(call => call[0] === 'create').length, 1);
  assert.equal(calls.filter(call => call[0] === 'bytes' && call[1] === id(2)).length, 1);
  assert.equal(calls.some(call => call[0] === 'publish'), false);
  assert.equal(render().dirty, false);
});

test('publishing enforces 4 videos and 250 words before making requests', async () => {
  let form = render(); form.setBody('từ '.repeat(251)); form = render(); await form.persist(true);
  assert.equal(calls.length, 0); assert.ok(render().error);
  form.setBody('Nội dung'); files = [2, 3, 4, 5, 6].map(n => ({ id: id(n) })); await render().persist(true);
  assert.equal(calls.length, 0);
});

test('a changed session stops the job before it writes the next account, preserving local content', async () => {
  let form = render(); form.setBody('Nội dung đang soạn'); changeSession = true;
  await render().persist(true);
  assert.deepEqual(calls.map(call => call[0]), ['create']);
  assert.equal(render().body, 'Nội dung đang soạn'); assert.match(render().error, /Phiên đăng nhập/);
});
