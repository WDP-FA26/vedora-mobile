import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { registerHooks, stripTypeScriptTypes } from 'node:module';
import { mock, test } from 'node:test';
import { fileURLToPath } from 'node:url';

const sourceRoot = new URL('../src/', import.meta.url);
registerHooks({
  resolve(specifier, context, next) {
    if (specifier.startsWith('.') && context.parentURL) {
      const url = new URL(specifier, context.parentURL);
      if (existsSync(fileURLToPath(url) + '.ts')) specifier = url.href + '.ts';
    }
    return next(specifier, context);
  },
  load(url, context, next) {
    if (url.startsWith(sourceRoot.href) && url.endsWith('.ts')) return {
      format: 'module', shortCircuit: true,
      source: stripTypeScriptTypes(readFileSync(fileURLToPath(url), 'utf8'), { mode: 'transform' }),
    };
    return next(url, context);
  },
});

class Events {
  listeners = new Map();
  addListener(name, callback) { this.listeners.set(name, callback); return { remove: () => this.listeners.delete(name) }; }
  emit(name, value) { this.listeners.get(name)?.(value); }
}
let permission, streamStart, modeWait, teardownThrows, writeThrows, sessionActive;
let streams = [], playlists = [], modes = [], active = [], files = new Map();
class Stream extends Events {
  constructor(options) { super(); this.options = options; streams.push(this); }
  async start() { this.startCount = (this.startCount ?? 0) + 1; await streamStart; this.recording = true; }
  stop() {
    this.recording = false; this.stopped = true;
    this.emit('audioStreamStatus', { isStreaming: false });
    setTimeout(() => { if (!playlists.some((playlist) => playlist.playing)) sessionActive = false; }, 100);
    if (teardownThrows) throw Error('device gone');
  }
  release() { this.released = true; }
  capture(sampleRate = 24000, channels = 1) { if (this.recording && sessionActive) this.emit('audioStreamBuffer', { data: new Float32Array(480).fill(0.5).buffer, sampleRate, channels }); }
}
class Playlist extends Events {
  currentIndex = 0;
  currentTime = 0;
  sources = [];
  add(source) { this.sources.push(source); }
  play() { this.playing = true; }
  clear() { this.sources = []; this.playing = false; this.currentIndex = this.currentTime = 0; }
  destroy() { this.destroyed = true; this.clear(); }
  finish(overrides = {}) { this.emit('playlistStatusUpdate', { playing: false, didJustFinish: true, trackCount: this.sources.length, currentIndex: this.sources.length - 1, ...overrides }); }
}
class CacheFile {
  constructor(path, name) { this.uri = `${path}/${name}`; }
  writeSync(data) { if (writeThrows) throw Error('disk full'); files.set(this.uri, data); }
  get exists() { return files.has(this.uri); }
  delete() { files.delete(this.uri); }
}
const native = { AudioStream: Stream };
mock.module('expo-audio', { namedExports: {
  AudioModule: native,
  createAudioPlaylist: () => { const playlist = new Playlist(); playlists.push(playlist); return playlist; },
  requestRecordingPermissionsAsync: async () => permission,
  setIsAudioActiveAsync: async (value) => { active.push(value); sessionActive = value; },
  setAudioModeAsync: async (value) => {
    modes.push({ ...value, duringCapture: streams.some((stream) => stream.recording) });
    // Model iOS's engine losing its input after an active session's category/route changes.
    for (const stream of streams) stream.recording = false;
    await modeWait;
  },
} });
mock.module('expo-file-system', { namedExports: { File: CacheFile, Paths: { cache: 'cache' } } });
const { createVoiceAudio } = await import('../src/features/meal-plan/services/voice-audio.ts');
const { pcm16Wav } = await import('../src/features/meal-plan/utils/voice-audio.ts');
const frame = Buffer.alloc(4800, 1).toString('base64');
const tick = () => new Promise((resolve) => setImmediate(resolve));
const advance = async (t, ms) => { await tick(); t.mock.timers.tick(ms); await tick(); };
async function fixture(t, start = true) {
  permission = { granted: true }; streamStart = modeWait = undefined; sessionActive = teardownThrows = writeThrows = false;
  streams = []; playlists = []; modes = []; active = []; files = new Map(); native.AudioStream = Stream;
  t.mock.timers.enable({ apis: ['setTimeout', 'setInterval', 'Date'], now: 10000 });
  const audio = await createVoiceAudio();
  const captured = [], errors = [];
  t.after(async () => { const ending = audio.stop(); await advance(t, 200); await ending; });
  const begin = () => audio.start((data) => captured.push(Buffer.from(data, 'base64')), (error) => errors.push(error.message));
  if (start) await begin();
  return { audio, begin, captured, errors };
}

test('WAV wraps exact PCM bytes in a mono 24 kHz header, including short final frames', () => {
  const wav = Buffer.from(pcm16Wav([new Uint8Array([0, 128]), new Uint8Array([255, 127])]));
  assert.equal(wav.toString('ascii', 0, 4), 'RIFF');
  assert.equal(wav.readUInt32LE(4), 40);
  assert.equal(wav.toString('ascii', 8, 16), 'WAVEfmt ');
  assert.equal(wav.readUInt16LE(20), 1);
  assert.equal(wav.readUInt16LE(22), 1);
  assert.equal(wav.readUInt32LE(24), 24000);
  assert.equal(wav.readUInt32LE(28), 48000);
  assert.equal(wav.readUInt16LE(32), 2);
  assert.equal(wav.readUInt16LE(34), 16);
  assert.equal(wav.toString('ascii', 36, 40), 'data');
  assert.equal(wav.readUInt32LE(40), 4);
  assert.deepEqual([...wav.subarray(44)], [0, 128, 255, 127]);
  assert.throws(() => pcm16Wav([new Uint8Array(1)]));
});
test('connecting configures iOS before starting capture, so mode changes cannot kill the mic engine', async (t) => {
  const { captured } = await fixture(t);
  assert.deepEqual(streams[0].options, { sampleRate: 24000, channels: 1, encoding: 'float32' });
  streams[0].capture(48000);
  assert.equal(captured[0].length, 480);
  assert.equal(captured[0].readInt16LE(0), 16384);
  assert.equal(modes[0].allowsRecording, true);
  assert.equal(modes[0].shouldRouteThroughEarpiece, false);
  assert.equal(modes[0].allowsBackgroundRecording, false);
  assert.equal(streams[0].recording, true);
  assert.equal(modes.some((mode) => mode.duringCapture), false);
});
test('queued replies suppress mic echo until playback finishes plus a short speaker tail', async (t) => {
  const { audio, captured } = await fixture(t);
  audio.play(frame);
  streams[0].capture();
  assert.equal(captured.at(-1).every((value) => value === 0), true);
  await advance(t, 240);
  assert.equal(files.size, 1);
  assert.equal(playlists[0].sources.length, 1);
  playlists[0].finish();
  assert.equal(files.size, 0);
  streams[0].capture();
  assert.equal(captured.at(-1).every((value) => value === 0), true);
  await advance(t, 201);
  streams[0].capture();
  assert.equal(captured.at(-1).readInt16LE(0), 16384);
  assert.equal(audio.isPlaying(), false);
});
test('small Gateway frames are batched in order and the last partial batch always flushes', async (t) => {
  const { audio } = await fixture(t);
  audio.play(Buffer.from([1, 2]).toString('base64'));
  audio.play(Buffer.from([3, 4]).toString('base64'));
  t.mock.timers.tick(239);
  assert.equal(files.size, 0);
  await advance(t, 1);
  assert.deepEqual([...files.values()][0].slice(44), new Uint8Array([1, 2, 3, 4]));
  audio.play(Buffer.from([5, 6]).toString('base64'));
  await advance(t, 240);
  assert.equal(playlists[0].sources.length, 2);
  playlists[0].finish({ trackCount: 1, currentIndex: 0 });
  assert.equal(files.size, 2, 'old finish event cannot clear newer queued tracks');
  playlists[0].finish();
  assert.equal(files.size, 0);
});
test('interrupt clears queued and pending audio, resumes mic and removes temporary files', async (t) => {
  const { audio, captured } = await fixture(t);
  audio.play(frame); await advance(t, 240);
  audio.play(frame); audio.interrupt();
  assert.equal(files.size, 0);
  assert.equal(playlists[0].sources.length, 0);
  await advance(t, 241);
  streams[0].capture();
  assert.equal(files.size, 0);
  assert.equal(captured.at(-1).readInt16LE(0), 16384);
});
test('ending releases all audio resources even when a disconnected mic throws', async (t) => {
  const { audio, captured } = await fixture(t);
  audio.play(frame); await advance(t, 240);
  teardownThrows = true;
  const stop = audio.stop();
  assert.equal(audio.stop(), stop);
  await advance(t, 200);
  await stop;
  assert.equal(streams[0].stopped, true);
  assert.equal(streams[0].released, true);
  assert.equal(playlists[0].destroyed, true);
  assert.equal(files.size, 0);
  assert.equal(active.at(-1), false);
  streams[0].capture(); audio.play(frame); t.mock.timers.tick(250);
  assert.equal(captured.length, 0);
  assert.equal(files.size, 0);
});
test('denied mic permission never starts native recording', async (t) => {
  const { begin } = await fixture(t, false);
  permission = { granted: false };
  await assert.rejects(begin, /cho phép Expo Go dùng mic/);
  assert.equal(streams.length, 0);
});
test('retry waits for a late recording start to finish and cleans the previous session first', async (t) => {
  const { audio, begin } = await fixture(t, false);
  let resume;
  streamStart = new Promise((resolve) => { resume = resolve; });
  const starting = begin(); await tick();
  const ending = audio.stop();
  let nextReady = false;
  const nextCall = createVoiceAudio().then((next) => { nextReady = true; return next; });
  await tick(); assert.equal(nextReady, false);
  resume(); await starting; await advance(t, 200); await ending;
  const next = await nextCall;
  assert.equal(streams[0].released, true);
  assert.equal(playlists[0].destroyed, true);
  assert.equal(modes.filter((mode) => mode.allowsRecording).length, 1);
  await next.stop();
});
test('invalid capture and playback errors are surfaced', async (t) => {
  const { audio, errors } = await fixture(t);
  streams[0].capture(24000, 2);
  assert.match(errors.at(-1), /Định dạng mic/);
  writeThrows = true;
  audio.play(frame); await advance(t, 240); await advance(t, 150);
  assert.match(errors.at(-1), /Không phát được/);
});
test('initial inactive snapshots and a slow first PCM buffer do not report a mic interruption', async (t) => {
  const { errors, captured } = await fixture(t);
  streams[0].emit('audioStreamStatus', { isStreaming: false });
  await advance(t, 4000);
  assert.deepEqual(errors, []);
  streams[0].capture();
  assert.equal(captured.length, 1);
  await advance(t, 4000);
  assert.match(errors.at(-1), /Mic bị gián đoạn/);
});
test('no PCM at all gets a startup error rather than claiming an established mic was interrupted', async (t) => {
  const { errors } = await fixture(t);
  await advance(t, 9000);
  assert.match(errors.at(-1), /Chưa nhận được âm thanh từ mic/);
  assert.doesNotMatch(errors.at(-1), /Mic bị gián đoạn/);
});
test('intentional playback pauses cannot trip mic health checks and capture restarts after the speaker tail', async (t) => {
  const { audio, errors, captured } = await fixture(t);
  streams[0].capture();
  audio.play(frame); await advance(t, 240); await advance(t, 150);
  assert.equal(streams[0].recording, false);
  assert.equal(playlists[0].playing, true);
  await advance(t, 4000);
  assert.deepEqual(errors, []);
  assert.equal(captured.at(-1).every((byte) => byte === 0), true);
  playlists[0].finish(); await advance(t, 201);
  assert.equal(streams[0].recording, true);
  assert.equal(streams[0].startCount, 2);
  streams[0].capture();
  assert.equal(captured.at(-1).readInt16LE(0), 16384);
  assert.equal(modes.some((mode) => mode.duringCapture), false);
});
test('an immediate retry waits out the previous iOS session deactivation before starting its mic', async (t) => {
  const { audio } = await fixture(t);
  const captured = [];
  let next;
  t.after(async () => { const ending = next?.stop(); await advance(t, 200); await ending; });
  const ending = audio.stop();
  const startingNext = createVoiceAudio().then(async (value) => {
    next = value;
    await next.start((data) => captured.push(data), (error) => assert.fail(error.message));
  });
  await advance(t, 200); await ending; await startingNext;
  await advance(t, 200);
  streams[1].capture();
  assert.equal(captured.length, 1);
  assert.equal(sessionActive, true);
});
test('closing during a pending playback mode change cannot start audio after teardown', async (t) => {
  const { audio, errors } = await fixture(t);
  let releaseMode;
  modeWait = new Promise((resolve) => { releaseMode = resolve; });
  audio.play(frame); await advance(t, 240); await advance(t, 150);
  const ending = audio.stop();
  releaseMode(); await ending;
  assert.equal(playlists[0].playing, false);
  assert.equal(playlists[0].destroyed, true);
  assert.equal(streams[0].released, true);
  assert.equal(files.size, 0);
  assert.deepEqual(errors, []);
});
test('invalid and unbounded PCM playback is rejected', async (t) => {
  const { audio } = await fixture(t);
  assert.throws(() => audio.play(Buffer.from([1]).toString('base64')), /PCM16/);
  assert.throws(() => audio.play(Buffer.alloc(61 * 48000).toString('base64')), /Âm thanh bị chậm/);
  assert.equal(files.size, 0);
});
test('older Expo Go reports a useful update message', async (t) => {
  const { audio } = await fixture(t, false);
  await audio.stop(); native.AudioStream = undefined;
  await assert.rejects(createVoiceAudio, /cập nhật Expo Go.*58/);
});
