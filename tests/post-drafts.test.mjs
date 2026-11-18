import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { mock, test } from 'node:test';
import { fileURLToPath } from 'node:url';

const sourceRoot = new URL('../src/', import.meta.url);
registerHooks({
  resolve(specifier, context, next) {
    // Its package entry is raw TypeScript under node_modules, which Node will not strip, so stub it here.
    if (specifier === 'expo-image-picker') return { url: 'data:text/javascript,export const launchImageLibraryAsync = async () => ({ canceled: true });', shortCircuit: true };
    if (specifier.startsWith('@/')) specifier = new URL(specifier.slice(2), sourceRoot).href;
    if ((specifier.startsWith('file:') || specifier.startsWith('.')) && context.parentURL) {
      const url = new URL(specifier, context.parentURL);
      for (const ext of ['.ts', '.tsx']) if (existsSync(fileURLToPath(url) + ext)) { specifier = url.href + ext; break; }
    }
    return next(specifier, context);
  },
});
const local = (path) => new URL(path, sourceRoot).href;

// A fake draft server: one draft whose attachments and version change like the API's.
let server, calls, failNextUpload;
function reset(media = []) {
  server = { version: 0, media: [...media], published: false };
  calls = [];
  failNextUpload = false;
}
const snapshot = () => ({ id: 'draft-1', kind: 'VIDEO', title: '', description: '', version: server.version, updatedAt: '', media: server.media.map((id) => ({ id, status: 'PROCESSING', failureReason: null, playbackUrl: null, posterUrl: null, durationSec: null })) });
mock.module(local('features/feed/services/compose.service.ts'), { namedExports: {
  createDraft: async (id) => { calls.push(['create', id]); return snapshot(); },
  getDraft: async () => { calls.push(['get']); return snapshot(); },
  saveDraft: async (_id, input) => {
    calls.push(['save', input]);
    assert.equal(input.expectedVersion, server.version);
    server.version++;
    return snapshot();
  },
  removeDraftMedia: async (_id, mediaId, expectedVersion) => {
    calls.push(['remove', mediaId]);
    assert.equal(expectedVersion, server.version);
    server.media = server.media.filter((id) => id !== mediaId);
    server.version++;
    return snapshot();
  },
  requestDraftUpload: async (_id, mediaId) => {
    calls.push(['upload', mediaId]);
    if (!server.media.includes(mediaId)) { server.media.push(mediaId); server.version++; }
    return { draft: snapshot(), upload: { url: 'https://upload.test', fields: {}, chunkSize: 1 } };
  },
  uploadVideoToCloudinary: async () => {
    calls.push(['bytes']);
    if (failNextUpload) { failNextUpload = false; throw new Error('Tải video lên thất bại. Kiểm tra kết nối và thử lại.'); }
  },
  publishDraft: async (_id, expectedVersion) => {
    calls.push(['publish', expectedVersion]);
    assert.equal(expectedVersion, server.version);
    server.published = true;
    return { id: 'draft-1', status: 'PROCESSING' };
  },
} });
const invalidated = [];
mock.module('@tanstack/react-query', { namedExports: { useQueryClient: () => ({ invalidateQueries: (filter) => invalidated.push(filter.queryKey) }) } });
mock.module('react-native', { namedExports: { Platform: { OS: 'android' } } });

const { useComposeActions } = await import('../src/features/feed/hooks/use-compose-actions.ts');
const { useVideoPublishStore } = await import('../src/features/feed/stores/video-publish-store.ts');
const compose = useComposeActions();
const video = { uri: 'file:///video.mp4', durationSeconds: 30 };
const input = (overrides) => ({ draftId: 'draft-1', title: 'Bún riêu chay', description: 'Nấu nước dùng.', video, keepMediaId: null, ...overrides });

/** Waits for the background job to stop on a final status. */
async function settled() {
  for (let i = 0; i < 100; i++) {
    const status = useVideoPublishStore.getState().job?.status;
    if (status && !['saving', 'uploading', 'posting'].includes(status)) return useVideoPublishStore.getState().job;
    await new Promise((resolve) => setTimeout(resolve, 5));
  }
  throw new Error('job did not finish');
}

test('publishing a new video replaces the draft\'s old video, then publishes at the latest version', async () => {
  reset(['old-video']);
  compose.startVideoPublish(input());
  const job = await settled();
  assert.equal(job.status, 'processing');
  const uploadId = calls.find(([name]) => name === 'upload')[1];
  assert.deepEqual(calls.map(([name]) => name), ['create', 'save', 'remove', 'upload', 'bytes', 'get', 'publish']);
  assert.equal(calls.find(([name]) => name === 'remove')[1], 'old-video');
  assert.deepEqual(server.media, [uploadId]);
  assert.equal(calls.find(([name]) => name === 'save')[1].body, 'Bún riêu chay\n\nNấu nước dùng.');
  assert.ok(server.published);
  useVideoPublishStore.getState().clear();
});

test('a failed upload keeps the draft; the retry drops the partial file and re-sends under a new ID; saving never publishes', async () => {
  reset();
  failNextUpload = true;
  compose.saveVideoDraft(input());
  let job = await settled();
  assert.equal(job.status, 'failed');
  assert.match(job.error, /Tải video lên thất bại/);
  const firstId = calls.find(([name]) => name === 'upload')[1];
  assert.deepEqual(server.media, [firstId], 'the partial attachment is still on the draft');

  calls = [];
  compose.retryVideoPublish();
  job = await settled();
  assert.equal(job.status, 'saved');
  const secondId = calls.find(([name]) => name === 'upload')[1];
  assert.notEqual(secondId, firstId);
  assert.deepEqual(calls.find(([name]) => name === 'remove'), ['remove', firstId]);
  assert.deepEqual(server.media, [secondId]);
  assert.equal(server.published, false);
  assert.ok(!calls.some(([name]) => name === 'publish'));
  useVideoPublishStore.getState().clear();
});

test('a reopened draft that keeps its video publishes without uploading or removing anything', async () => {
  reset(['kept']);
  compose.startVideoPublish(input({ video: null, keepMediaId: 'kept' }));
  const job = await settled();
  assert.equal(job.status, 'processing');
  assert.deepEqual(calls.map(([name]) => name), ['create', 'save', 'get', 'publish']);
  assert.deepEqual(server.media, ['kept']);
  useVideoPublishStore.getState().clear();
});

test('publishing needs a video, and saving refuses an empty form before any request', () => {
  reset();
  assert.throws(() => compose.startVideoPublish(input({ video: null })), /Chọn video hướng dẫn/);
  assert.throws(() => compose.saveVideoDraft(input({ title: ' ', description: '', video: null })), /Bản nháp đang trống/);
  assert.deepEqual(calls, []);
});
