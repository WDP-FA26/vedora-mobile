import assert from 'node:assert/strict';
import { mock, test } from 'node:test';

const platform = { OS: 'android' };
let uploadOptions;
let releases;
let upload = async () => ({ status: 200 });
mock.module('react-native', { namedExports: { Platform: platform } });
mock.module('expo-file-system', {
  namedExports: {
    UploadType: { BINARY_CONTENT: 0 },
    File: class {
      exists = true;
      size = 100;
      createUploadTask(_url, options) {
        uploadOptions = options;
        return { uploadAsync: () => upload(), release: () => { releases++; } };
      }
    },
  },
});
const { uploadImageToStorage } = await import('../src/shared/api/upload-image.ts');
const target = { url: 'https://storage.example.com/signed', headers: { 'Content-Type': 'image/png', 'x-signed-header': 'keep' } };
const image = { uri: 'file:///image.png', file: new File(['image'], 'image.png') };

test('native upload keeps signed headers and releases the task on success and HTTP failure', async (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  releases = 0;
  await uploadImageToStorage(target, image, 'image/jpeg');
  assert.equal(uploadOptions.httpMethod, 'PUT');
  assert.deepEqual(uploadOptions.headers, target.headers);
  assert.equal(uploadOptions.uploadType, 0);
  assert.equal(releases, 1);
  // Completion clears the timer; a later tick must not abort the finished request.
  t.mock.timers.tick(60_000);
  assert.equal(uploadOptions.signal.aborted, false);
  upload = async () => ({ status: 403 });
  await assert.rejects(uploadImageToStorage(target, image, 'image/png'), /HTTP 403/);
  assert.equal(releases, 2);
});

test('stalled native upload stops waiting even if cancellation is not acknowledged; retry works', async (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  releases = 0;
  upload = () => new Promise(() => {});
  const pending = uploadImageToStorage(target, image, 'image/png');
  const rejected = assert.rejects(pending, /Tải ảnh quá lâu/);
  t.mock.timers.tick(60_000);
  await rejected;
  assert.equal(uploadOptions.signal.aborted, true);
  assert.equal(releases, 1);
  upload = async () => ({ status: 201 });
  await uploadImageToStorage(target, image, 'image/png');
  assert.equal(releases, 2);
});

test('web uploads also stop waiting and abort a stalled fetch', async (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  platform.OS = 'web';
  let signal;
  t.mock.method(globalThis, 'fetch', (_url, options) => {
    signal = options.signal;
    return new Promise(() => {});
  });
  try {
    const pending = uploadImageToStorage(target, image, 'image/png');
    const rejected = assert.rejects(pending, /Tải ảnh quá lâu/);
    t.mock.timers.tick(60_000);
    await rejected;
    assert.equal(signal.aborted, true);
  } finally {
    platform.OS = 'android';
  }
});
