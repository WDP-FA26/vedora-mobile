import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { registerHooks, stripTypeScriptTypes } from 'node:module';
import { mock, test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { runInNewContext } from 'node:vm';

const root = new URL('../src/', import.meta.url);
registerHooks({
  resolve(specifier, context, next) {
    if (specifier.startsWith('.') && context.parentURL) {
      const url = new URL(specifier, context.parentURL);
      if (existsSync(fileURLToPath(url) + '.ts')) specifier = url.href + '.ts';
    }
    return next(specifier, context);
  },
  load(url, context, next) {
    if (url.startsWith(root.href) && url.endsWith('.ts')) return { format: 'module', shortCircuit: true,
      source: stripTypeScriptTypes(readFileSync(fileURLToPath(url), 'utf8'), { mode: 'transform' }) };
    return next(url, context);
  },
});
let granted = true;
mock.module('expo-audio', { exports: { requestRecordingPermissionsAsync: async () => ({ granted }) } });
const { createVoiceAudio, connectVoiceAudioHost, receiveVoiceAudioMessage } = await import('../src/features/meal-plan/services/voice-audio.ts');
const { audioBridgeMessageSchema } = await import('../src/features/meal-plan/types/voice-audio-bridge.schema.ts');
const { VOICE_AUDIO_HTML } = await import('../src/features/meal-plan/utils/voice-audio-html.ts');
const tick = () => new Promise((resolve) => setImmediate(resolve));
const pcm = Buffer.alloc(960);
for (let i = 0; i < pcm.length; i += 2) pcm.writeInt16LE(16384, i);
const speech = pcm.toString('base64');

async function nativeFixture(t, { start = true, acknowledgeStop = true } = {}) {
  granted = true;
  const commands = [], captured = [], errors = [];
  const release = connectVoiceAudioHost({ send(command) {
    commands.push(command);
    if (command.type === 'start') receiveVoiceAudioMessage({ type: 'started', id: command.id });
    if (command.type === 'stop' && acknowledgeStop) receiveVoiceAudioMessage({ type: 'stopped', id: command.id });
  } });
  const audio = await createVoiceAudio();
  const begin = () => audio.start((data) => captured.push(data), (error) => errors.push(error.message));
  t.after(async () => {
    const stopping = audio.stop();
    const command = commands.at(-1);
    if (command?.type === 'stop') receiveVoiceAudioMessage({ type: 'stopped', id: command.id });
    await stopping; release();
  });
  if (start) await begin();
  return { audio, commands, captured, errors, begin, release, id: () => commands.find((command) => command.type === 'start').id };
}

test('native captures speech throughout assistant playback and interruption never stops the mic', async (t) => {
  const f = await nativeFixture(t);
  f.audio.play(speech);
  receiveVoiceAudioMessage({ type: 'input', id: f.id(), audio: speech });
  assert.equal(f.captured.at(-1), speech);
  assert.equal(f.audio.isPlaying(), true);
  f.audio.interrupt();
  receiveVoiceAudioMessage({ type: 'input', id: f.id(), audio: speech });
  assert.equal(f.captured.length, 2);
  assert.equal(f.audio.isPlaying(), false);
  assert.deepEqual(f.commands.map((command) => command.type), ['start', 'play', 'interrupt']);
});
test('native ignores stale playback acknowledgments and frames from another call', async (t) => {
  const f = await nativeFixture(t);
  f.audio.play(speech); const older = f.commands.at(-1).sequence;
  f.audio.play(speech); const latest = f.commands.at(-1).sequence;
  receiveVoiceAudioMessage({ type: 'playback', id: f.id(), sequence: older, playing: false });
  assert.equal(f.audio.isPlaying(), true);
  receiveVoiceAudioMessage({ type: 'input', id: f.id() + 1, audio: speech });
  assert.equal(f.captured.length, 0);
  receiveVoiceAudioMessage({ type: 'playback', id: f.id(), sequence: latest, playing: false });
  assert.equal(f.audio.isPlaying(), false);
});
test('native never starts capture without OS microphone permission', async (t) => {
  const f = await nativeFixture(t, { start: false }); granted = false;
  await assert.rejects(f.begin, /mic/);
  assert.equal(f.commands.length, 0);
});
test('retry waits for the previous document to acknowledge mic release', async (t) => {
  const f = await nativeFixture(t, { acknowledgeStop: false });
  let nextReady = false;
  const next = createVoiceAudio().then((value) => { nextReady = true; return value; });
  await tick();
  assert.equal(nextReady, false);
  receiveVoiceAudioMessage({ type: 'stopped', id: f.id() });
  const audio = await next;
  const stopping = audio.stop();
  await stopping;
  assert.equal(nextReady, true);
});
test('host loss reports an interruption and releases a running call exactly once', async (t) => {
  const f = await nativeFixture(t);
  f.release(); f.release();
  assert.equal(f.errors.length, 1);
  assert.equal(f.commands.filter((command) => command.type === 'stop').length, 1);
  assert.equal(f.audio.isPlaying(), false);
});
test('mic watchdog handles absent PCM, including while assistant audio is playing', async (t) => {
  t.mock.timers.enable({ apis: ['setTimeout', 'setInterval', 'Date'], now: 10000 });
  const f = await nativeFixture(t);
  f.audio.play(speech);
  t.mock.timers.tick(9000);
  assert.equal(f.errors.length, 1);
  assert.equal(f.audio.isPlaying(), false);
});
test('bridge messages reject malformed audio and native playback rejects odd PCM frames', async (t) => {
  for (const audio of ['<script>', 'abc', 'a'.repeat(32769)]) assert.equal(audioBridgeMessageSchema.safeParse({ type: 'input', id: 1, audio }).success, false);
  const f = await nativeFixture(t);
  for (const audio of ['YQ==', 'invalid!', 'a'.repeat(524292)]) assert.throws(() => f.audio.play(audio));
});

function browserFixture(t, options = {}) {
  const events = [], contexts = [], constraints = [], blobs = new Map(), processors = [];
  const listeners = new Map();
  const track = { stopped: 0, stop() { this.stopped++; } };
  const stream = { getTracks: () => [track], getAudioTracks: () => [track] };
  const node = () => ({ connect() {}, disconnect() { this.disconnected = true; } });
  let workletClass;
  class Context {
    constructor() {
      this.sampleRate = options.sampleRate ?? 24000; this.state = 'suspended'; this.currentTime = 0; this.sources = []; contexts.push(this);
      if (options.worklet) this.audioWorklet = { addModule: async (url) => {
        runInNewContext(blobs.get(url), { sampleRate: this.sampleRate, Float32Array,
          AudioWorkletProcessor: class { constructor() { this.port = {}; } }, registerProcessor: (_, value) => { workletClass = value; } });
      } };
    }
    async resume() { this.state = 'running'; }
    async close() { this.state = 'closed'; this.onstatechange?.(); }
    createMediaStreamSource() { return node(); }
    createGain() { return { ...node(), gain: { value: 1 } }; }
    createScriptProcessor() { this.processor = node(); return this.processor; }
    createBuffer(_, count, rate) { const data = new Float32Array(count); return { duration: count / rate, getChannelData: () => data }; }
    createBufferSource() {
      const source = { ...node(), start(time) { this.time = time; }, stop() { this.stopped = true; } };
      this.sources.push(source); return source;
    }
  }
  class WorkletNode {
    constructor(context) {
      Object.assign(this, node()); this.port = {}; this.processor = new workletClass();
      this.processor.port.postMessage = (data) => this.port.onmessage?.({ data }); processors.push(this);
    }
  }
  const window = { AudioContext: Context, AudioWorkletNode: options.worklet ? WorkletNode : undefined,
    ReactNativeWebView: { postMessage: (value) => events.push(JSON.parse(value)) }, addEventListener: (name, listener) => listeners.set(name, listener) };
  const navigator = { mediaDevices: { getUserMedia: async (input) => {
    constraints.push(input);
    if (options.permissionError) throw Object.assign(new Error(), { name: 'NotAllowedError' });
    await options.permissionWait; return stream;
  } } };
  runInNewContext(VOICE_AUDIO_HTML.match(/<script>([\s\S]*)<\/script>/)[1], { window, navigator, AudioContext: Context, AudioWorkletNode: WorkletNode,
    Float32Array, Set, Math, btoa, atob, Blob: class { constructor(parts) { this.code = parts.join(''); } },
    URL: { createObjectURL: (blob) => { const id = String(blobs.size); blobs.set(id, blob.code); return id; }, revokeObjectURL() {} } });
  const send = (command) => window.vedoraVoice(command);
  t.after(async () => { send({ type: 'stop', id: 1 }); await tick(); });
  return { send, events, contexts, constraints, track, processors, listeners };
}

test('browser runs full duplex with echo cancellation and schedules PCM without stopping input', async (t) => {
  const f = browserFixture(t);
  f.send({ type: 'start', id: 1 }); await tick();
  assert.equal(f.events.at(-1).type, 'started');
  assert.equal(f.constraints[0].audio.echoCancellation, true);
  const context = f.contexts[0];
  f.send({ type: 'play', id: 1, sequence: 1, audio: speech });
  f.send({ type: 'play', id: 1, sequence: 2, audio: speech });
  assert.equal(context.sources[0].time, 0);
  assert.equal(context.sources[1].time, 0.02);
  context.processor.onaudioprocess({ inputBuffer: { getChannelData: () => new Float32Array([0.5, -1]), sampleRate: 24000 } });
  assert.deepEqual([...Buffer.from(f.events.at(-1).audio, 'base64')], [0, 64, 0, 128]);
  f.send({ type: 'interrupt', id: 1, sequence: 3 });
  assert.equal(f.track.stopped, 0);
  assert.equal(context.sources.every((source) => source.stopped), true);
  assert.equal(typeof context.processor.onaudioprocess, 'function');
});
test('worklet batches 20 ms of hardware audio and resamples to the Gateway 24 kHz format', async (t) => {
  const f = browserFixture(t, { worklet: true, sampleRate: 48000 });
  f.send({ type: 'start', id: 1 }); await tick();
  const processor = f.processors[0].processor;
  processor.process([[new Float32Array(959).fill(0.5)]]);
  assert.equal(f.events.filter((event) => event.type === 'input').length, 0);
  processor.process([[new Float32Array([0.5])]]);
  const frame = Buffer.from(f.events.at(-1).audio, 'base64');
  assert.equal(frame.length, 960);
  assert.equal(frame.readInt16LE(0), 16384);
});
test('permission denial never emits a started session and closes the audio context', async (t) => {
  const f = browserFixture(t, { permissionError: true });
  f.send({ type: 'start', id: 1 }); await tick();
  assert.equal(f.events.some((event) => event.type === 'started'), false);
  assert.equal(f.events.find((event) => event.type === 'error').code, 'permission');
  assert.equal(f.contexts[0].state, 'closed');
});
test('closing while microphone permission is pending releases any late stream without starting capture', async (t) => {
  let release;
  const f = browserFixture(t, { permissionWait: new Promise((resolve) => { release = resolve; }) });
  f.send({ type: 'start', id: 1 }); await tick();
  f.send({ type: 'stop', id: 1 }); await tick();
  release(); await tick();
  assert.equal(f.events.some((event) => event.type === 'started'), false);
  assert.equal(f.track.stopped, 1);
  assert.equal(f.contexts[0].state, 'closed');
});
test('ending the document releases tracks, processors and scheduled speaker audio', async (t) => {
  const f = browserFixture(t);
  f.send({ type: 'start', id: 1 }); await tick();
  f.send({ type: 'play', id: 1, sequence: 1, audio: speech });
  f.listeners.get('pagehide')(); await tick();
  assert.equal(f.track.stopped, 1);
  assert.equal(f.contexts[0].processor.onaudioprocess, null);
  assert.equal(f.contexts[0].state, 'closed');
  assert.equal(f.contexts[0].sources[0].stopped, true);
});
