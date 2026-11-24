import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { registerHooks, stripTypeScriptTypes } from 'node:module';
import { mock, test } from 'node:test';
import { fileURLToPath } from 'node:url';

const sourceRoot = new URL('../src/', import.meta.url);
registerHooks({
  resolve(specifier, context, next) {
    if (specifier === 'expo-image-picker') return { url: 'data:text/javascript,export const launchImageLibraryAsync = async () => globalThis.__reportPick();', shortCircuit: true };
    if (specifier.startsWith('@/')) specifier = new URL(specifier.slice(2), sourceRoot).href;
    if ((specifier.startsWith('file:') || specifier.startsWith('.')) && context.parentURL) {
      const url = new URL(specifier, context.parentURL);
      if (existsSync(fileURLToPath(url) + '.ts')) specifier = url.href + '.ts';
    }
    return next(specifier, context);
  },
  load(url, context, next) {
    if (url.startsWith(sourceRoot.href) && url.endsWith('.ts')) return { format: 'module', shortCircuit: true, source: stripTypeScriptTypes(readFileSync(fileURLToPath(url), 'utf8'), { mode: 'transform' }) };
    return next(url, context);
  },
});
const local = (path) => new URL(path, sourceRoot).href;
let token = 'one', requests = [], response, picker, onRequest = () => {};
const session = (selector) => selector({ accessToken: token });
session.getState = () => ({ accessToken: token });
const platform = { OS: 'web' };
mock.module(local('shared/stores/session-store.ts'), { namedExports: { useSessionStore: session } });
mock.module(local('shared/api/api-client.ts'), { namedExports: { apiClient: {
  request: async (config) => { requests.push(config); onRequest(); return { data: response }; },
  post: async (url, data) => { requests.push({ url, data }); onRequest(); },
} } });
mock.module(local('features/feed/hooks/use-feed.ts'), { namedExports: { patchCachedPost() {} } });
mock.module('@tanstack/react-query', { namedExports: { useMutation: (config) => config, useQuery: (config) => config, useInfiniteQuery: (config) => config, useQueryClient: () => ({}) } });
mock.module('react-native', { namedExports: { Platform: platform } });
mock.module('expo-file-system', { namedExports: { File: class { size = 1024; } } });
globalThis.__reportPick = () => typeof picker === 'function' ? picker() : picker;
const schema = await import('../src/features/posts/types/posts.schema.ts');
const { reportPost } = await import('../src/features/posts/services/posts.service.ts');
const { uploadReportEvidence } = await import('../src/features/posts/services/report-evidence.service.ts');
const { useReportEvidence } = await import('../src/features/posts/hooks/use-report-evidence.ts');
const { useReportPost } = await import('../src/features/posts/hooks/use-posts.ts');
const { reportError } = await import('../src/features/posts/utils/report-error.ts');
const { ApiError } = await import('../src/shared/api/api-error.ts');
const id = '00000000-0000-4000-8000-000000000001';
const ids = [1, 2, 3, 4].map(n => `00000000-0000-4000-8000-00000000000${n}`);
const valid = { reason: 'OTHER', details: ' Chi tiết ', evidenceIds: [id] };
function reset() { token = 'one'; requests = []; response = { id }; onRequest = () => {}; platform.OS = 'web'; }

test('report accepts up to 3 unique UUID evidence IDs, and OTHER still needs text', () => {
  assert.equal(schema.reportFormSchema.parse(valid).details, 'Chi tiết');
  assert.deepEqual(schema.reportFormSchema.parse({ reason: 'SPAM', details: '' }).evidenceIds, []);
  assert.ok(schema.reportFormSchema.safeParse({ ...valid, evidenceIds: ids.slice(0, 3) }).success);
  for (const patch of [{ evidenceIds: ids }, { evidenceIds: [id, id] }, { evidenceIds: ['bad'] }, { details: ' ' }, { details: 'a'.repeat(501) }]) assert.equal(schema.reportFormSchema.safeParse({ ...valid, ...patch }).success, false);
});
test('evidence validates JPG/PNG/WebP and the 5 MB boundary', () => {
  for (const contentType of ['image/jpeg', 'image/png', 'image/webp']) assert.ok(schema.reportEvidenceInputSchema.safeParse({ contentType, sizeBytes: 5242880 }).success);
  for (const patch of [{ contentType: 'image/heic' }, { sizeBytes: 0 }, { sizeBytes: 5242881 }]) assert.equal(schema.reportEvidenceInputSchema.safeParse({ contentType: 'image/png', sizeBytes: 1, ...patch }).success, false);
});
test('web sends a single multipart file to the post evidence endpoint, validates response and report payload', async () => {
  reset();
  const file = new File(['png'], 'proof.png', { type: 'image/png' });
  assert.deepEqual(await uploadReportEvidence(id, { uri: 'blob:preview', file }, { contentType: 'image/png', sizeBytes: file.size }), { id });
  const config = requests[0];
  assert.equal(config.url, `/posts/${id}/report/evidence`);
  assert.equal(config.data.get('file'), file);
  assert.deepEqual([...config.data.keys()], ['file']);
  assert.equal(config.headers['Content-Type'], undefined);
  await reportPost(id, valid);
  assert.deepEqual(requests.at(-1).data, { reason: 'OTHER', details: 'Chi tiết', evidenceIds: [id] });
  await reportPost(id, { reason: 'SPAM', details: '', evidenceIds: [] });
  assert.deepEqual(requests.at(-1).data, { reason: 'SPAM' });
  response = { id: 'invalid' };
  await assert.rejects(uploadReportEvidence(id, { uri: 'blob:preview', file }, { contentType: 'image/png', sizeBytes: file.size }));
});
test('native multipart contains the local URI and MIME, without using signed storage', async () => {
  reset(); platform.OS = 'android';
  const NativeForm = globalThis.FormData;
  class NativeFormData { fields = []; append(...args) { this.fields.push(args); } }
  globalThis.FormData = NativeFormData;
  try {
    await uploadReportEvidence(id, { uri: 'file:///proof.webp' }, { contentType: 'image/webp', sizeBytes: 1024 });
    assert.deepEqual(requests[0].data.fields, [['file', { uri: 'file:///proof.webp', name: 'evidence.webp', type: 'image/webp' }]]);
    assert.equal(requests[0].headers['Content-Type'], 'multipart/form-data');
  } finally { globalThis.FormData = NativeForm; platform.OS = 'web'; }
});
test('picker cancellation, oversized images and a changed session never upload', async () => {
  reset(); picker = { canceled: true };
  const mutation = useReportEvidence(id);
  assert.equal(mutation.retry, false); assert.equal(mutation.networkMode, 'always');
  assert.equal(await mutation.mutationFn(), null);
  picker = { canceled: false, assets: [{ uri: 'blob:huge', mimeType: 'image/png', fileSize: 5242881 }] };
  await assert.rejects(mutation.mutationFn());
  picker = () => { token = 'two'; return { canceled: false, assets: [] }; };
  await assert.rejects(mutation.mutationFn(), error => error.code === 'SESSION_CHANGED');
  assert.equal(requests.length, 0);
});
test('successful upload returns its preview; switching session during upload discards the result', async () => {
  reset();
  const file = new File(['png'], 'proof.png', { type: 'image/png' });
  picker = { canceled: false, assets: [{ uri: 'blob:preview', file }] };
  assert.deepEqual(await useReportEvidence(id).mutationFn(), { id, uri: 'blob:preview' });
  onRequest = () => { token = 'two'; };
  await assert.rejects(useReportEvidence(id).mutationFn(), error => error.code === 'SESSION_CHANGED');
});
test('report mutation does not auto-retry, and rejects an old session before sending or after response', async () => {
  reset(); const mutation = useReportPost(id);
  assert.equal(mutation.retry, false); assert.equal(mutation.networkMode, 'always');
  token = 'two';
  await assert.rejects(mutation.mutationFn(valid), error => error.code === 'SESSION_CHANGED');
  assert.equal(requests.length, 0);
  token = 'one'; onRequest = () => { token = 'two'; };
  await assert.rejects(mutation.mutationFn(valid), error => error.code === 'SESSION_CHANGED');
});
test('expired IDs, file limits, invalid formats and unavailable storage show actionable errors', () => {
  for (const [status, code, text] of [[400, 'UNKNOWN_ATTACHMENT', 'Gỡ ảnh'], [413, 'FILE_TOO_LARGE', 'dung lượng'], [415, 'UNSUPPORTED_FILE_TYPE', 'JPG'], [503, 'UNAVAILABLE', 'gỡ ảnh']]) assert.ok(reportError(new ApiError(status, code, 'Internal')).includes(text));
});
