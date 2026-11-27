import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { registerHooks, stripTypeScriptTypes } from 'node:module';
import { mock, test } from 'node:test';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const sourceRoot = new URL('../src/', import.meta.url);
registerHooks({
  resolve(specifier, context, next) {
    if (specifier.startsWith('@/')) specifier = new URL(specifier.slice(2), sourceRoot).href;
    if ((specifier.startsWith('file:') || specifier.startsWith('.')) && context.parentURL) {
      const url = new URL(specifier, context.parentURL);
      for (const ext of ['.ts', '.tsx']) if (existsSync(fileURLToPath(url) + ext)) { specifier = url.href + ext; break; }
    }
    return next(specifier, context);
  },
  load(url, context, next) {
    const pathname = new URL(url).pathname;
    if (url.startsWith(sourceRoot.href) && /\.tsx?$/.test(pathname)) {
      const source = readFileSync(fileURLToPath(url), 'utf8');
      return { format: 'module', shortCircuit: true, source: pathname.endsWith('.tsx')
        ? ts.transpileModule(source, { compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.ESNext } }).outputText
        : stripTypeScriptTypes(source, { mode: 'transform' }) };
    }
    return next(url, context);
  },
});
const local = (path) => new URL(path, sourceRoot).href;

let audio;
let setupResponse;
let turnHandler;
const session = { token: 'vcst_test', url: 'wss://gateway.test/live', model: 'openai/gpt-live-1.1', expiresAt: null };
const screen = { weekStart: '2026-11-23', panel: 'none', day: 'FRI' };
mock.module(local('features/meal-plan/services/voice-audio.ts'), { namedExports: { createVoiceAudio: async () => audio } });
mock.module(local('features/meal-plan/services/voice.service.ts'), { namedExports: {
  createVoiceSession: async () => setupResponse,
  sendVoiceTurn: (...args) => turnHandler(...args),
} });
class FakeSocket {
  static OPEN = 1;
  static all = [];
  readyState = 1;
  bufferedAmount = 0;
  sent = [];
  constructor(url, protocols) { this.url = url; this.protocols = protocols; FakeSocket.all.push(this); }
  send(value) { this.sent.push(JSON.parse(value)); }
  close() { this.readyState = 3; }
  emit(event) { this.onmessage?.({ data: JSON.stringify(event) }); }
}
globalThis.WebSocket = FakeSocket;
const { PlannerVoiceCall } = await import('../src/features/meal-plan/services/voice-call.ts');
const { UtteranceAssembler, FarewellTracker } = await import('../src/features/meal-plan/services/voice-call-state.ts');
const { pcm16Base64 } = await import('../src/features/meal-plan/utils/voice-audio.ts');
const { VoiceNoiseGate } = await import('../src/features/meal-plan/utils/voice-noise-gate.ts');
const { voiceScreenCommandSchema, voiceTurnSchema } = await import('../src/features/meal-plan/types/voice.schema.ts');
const tick = () => new Promise((resolve) => setImmediate(resolve));
function fixture(t) {
  FakeSocket.all = [];
  setupResponse = session;
  audio = { stopCount: 0, interrupted: 0, played: [], start: async (send) => { audio.send = send; }, stop: async () => { audio.stopCount++; }, play: (chunk) => audio.played.push(chunk), interrupt: () => audio.interrupted++, isPlaying: () => false };
  const events = { statuses: [], errors: [], screens: [], refreshes: [], texts: [], ended: 0, requests: [] };
  turnHandler = async (input, signal, onEvent) => { events.requests.push(input); onEvent({ type: 'text-delta', delta: 'Đã ghi món.' }); onEvent({ type: 'finish' }); };
  const call = new PlannerVoiceCall({ threadId: 'e509dd5c-6cd6-4c2b-8848-b45dbe003561', fullName: 'An', today: '2026-11-27', screen, getScreen: () => screen,
    onStatus: (s) => events.statuses.push(s), onText: (s) => events.texts.push(s), onHeard: () => {}, onError: (s) => events.errors.push(s), onScreen: (s) => events.screens.push(s), onRefresh: (s) => events.refreshes.push(s), onTurnEnd: () => events.ended++ });
  t.after(() => call.end());
  return { call, events };
}
async function connect(call) {
  await call.start();
  const socket = FakeSocket.all.at(-1);
  socket.onopen();
  socket.emit({ type: 'session-started', sessionId: 'call-1' });
  return socket;
}
function delegate(socket, id = 'delegation-1') {
  socket.emit({ type: 'transcript-fragment', speaker: 'user', delta: 'Mình ăn phở chay.', startMs: 0, endMs: 500 });
  socket.emit({ type: 'delegation-created', delegationId: id, offsetMs: 200 });
}

test('native PCM encoding preserves signs, clips and writes little-endian samples', () => {
  const bytes = Buffer.from(pcm16Base64(new Float32Array([-2, -1, 0, 1, 2])), 'base64');
  assert.deepEqual(Array.from({ length: 5 }, (_, i) => bytes.readInt16LE(i * 2)), [-32768, -32768, 0, 32767, 32767]);
});
test('automatic mic gate suppresses ambient noise and preserves quiet speech endings', () => {
  const gate = new VoiceNoiseGate();
  const noise = new Float32Array(480).fill(0.001);
  assert.equal(Buffer.from(pcm16Base64(noise, 24000, gate), 'base64').every((byte) => byte === 0), true);
  assert.equal(gate.processDb(-20, 1000), true);
  assert.equal(gate.processDb(-80, 1100), true);
  assert.equal(gate.processDb(-80, 1300), false);
  assert.equal(gate.processDb(-20, 1400), true);
});
test('PCM resampling converts 48 kHz capture to 24 kHz mono frames', () => {
  const bytes = Buffer.from(pcm16Base64(new Float32Array([0, 0.1, 0.5, 0.6]), 48000), 'base64');
  assert.equal(bytes.length, 4);
  assert.equal(bytes.readInt16LE(2), 16384);
});
test('utterance assembly includes trailing words but never submits them twice', () => {
  const words = new UtteranceAssembler();
  words.addFragment({ text: 'trưa nay', startMs: 0, endMs: 400 });
  words.addFragment({ text: ' ăn phở chay.', startMs: 500, endMs: 1000 });
  assert.equal(words.takeUtterance(200), 'trưa nay ăn phở chay.');
  assert.equal(words.takeUtterance(200), '');
});
test('screen validation accepts recipe step and rejects malformed dates/directions', () => {
  assert.equal(voiceScreenCommandSchema.parse({ focus: { kind: 'recipe', recipeId: 'a', title: 'A', section: 'steps', step: 2 }, close: null }).focus.step, 2);
  assert.equal(voiceScreenCommandSchema.safeParse({ focus: null, close: null, scroll: 'left' }).success, false);
  assert.equal(voiceTurnSchema.safeParse({ weekStart: '2026-11-24' }).success, false);
});
test('connect uses web Live model, token subprotocol, PCM formats and Vietnamese instructions', async (t) => {
  const { call } = fixture(t);
  const socket = await connect(call);
  assert.deepEqual(socket.protocols, ['ai-gateway-realtime.v1', 'ai-gateway-auth.vcst_test']);
  const start = socket.sent[0];
  assert.equal(start.type, 'session-start');
  assert.equal(start.modelId, session.model);
  assert.deepEqual(start.config.inputAudioFormat, { type: 'audio/pcm', rate: 24000 });
  assert.deepEqual(start.config.providerOptions.openai.delegation, { type: 'client' });
  assert.match(start.config.instructions, /Speak ONLY.*Vietnamese/);
  audio.send('pcm');
  assert.equal(socket.sent.at(-1).type, 'input-audio-append');
});
test('mute blocks capture; unmute resumes it; audio chunks play through the same call', async (t) => {
  const { call } = fixture(t);
  const socket = await connect(call);
  call.toggleMute();
  const count = socket.sent.length;
  audio.send('hidden');
  assert.equal(socket.sent.length, count);
  call.toggleMute(); audio.send('heard');
  assert.equal(socket.sent.at(-1).audio, 'heard');
  socket.emit({ type: 'audio-chunk', delta: 'reply-pcm' });
  assert.deepEqual(audio.played, ['reply-pcm']);
});
test('delegation submits spoken text and current screen once, then sends commentary on finish', async (t) => {
  const { call, events } = fixture(t);
  const socket = await connect(call);
  delegate(socket); await tick();
  socket.emit({ type: 'delegation-created', delegationId: 'delegation-1' });
  await tick();
  assert.equal(events.requests.length, 1);
  assert.equal(events.requests[0].message, 'Mình ăn phở chay.');
  assert.deepEqual(events.requests[0].screen, screen);
  assert.equal(socket.sent.at(-1).providerOptions.openai.channel, 'commentary');
  assert.equal(socket.sent.at(-1).content, 'Đã ghi món.');
});
test('transient screen/refresh and summary-only responses are handled without tool output assumptions', async (t) => {
  const { call, events } = fixture(t);
  turnHandler = async (_, __, emit) => {
    emit({ type: 'data-screen', data: { focus: { kind: 'eatingLog', date: '2026-11-27' }, close: 'recipe', scroll: 'bottom' } });
    emit({ type: 'data-refresh', data: { log: true } });
    emit({ type: 'data-summary', data: { text: 'Đã ghi nhật ký.' } });
    emit({ type: 'finish' });
  };
  const socket = await connect(call); delegate(socket); await tick();
  assert.equal(events.screens[0].focus.kind, 'eatingLog');
  assert.deepEqual(events.refreshes[0], { log: true });
  assert.equal(socket.sent.at(-1).content, 'Đã ghi nhật ký.');
});
test('ending a pending call aborts mutations, releases mic and ignores late screen commands', async (t) => {
  const { call, events } = fixture(t);
  let activeSignal, emitLater, resolveTurn;
  turnHandler = (_, signal, emit) => { activeSignal = signal; emitLater = emit; return new Promise((resolve) => { resolveTurn = resolve; }); };
  const socket = await connect(call); delegate(socket); await tick();
  call.end();
  assert.equal(activeSignal.aborted, true);
  assert.equal(audio.stopCount, 1);
  emitLater({ type: 'data-screen', data: { focus: { kind: 'bodyMetrics' }, close: null } });
  resolveTurn(); await tick();
  assert.equal(events.screens.length, 0);
  assert.equal(socket.sent.at(-1).type, 'session-close');
});
test('closing during session setup never creates a socket after the response arrives', async (t) => {
  const { call } = fixture(t);
  let resolveSetup;
  setupResponse = new Promise((resolve) => { resolveSetup = resolve; });
  const starting = call.start(); await tick();
  call.end(); resolveSetup(session); await starting;
  assert.equal(FakeSocket.all.length, 0);
  assert.equal(audio.stopCount, 1);
});
test('stream failure never announces success and refreshes possibly saved changes', async (t) => {
  const { call, events } = fixture(t);
  turnHandler = async () => { throw new Error('private debug'); };
  const socket = await connect(call); delegate(socket); await tick();
  assert.match(events.texts.at(-1), /có thể đã được lưu/);
  assert.doesNotMatch(events.texts.at(-1), /private debug/);
  assert.deepEqual(events.refreshes.at(-1), { plan: true, log: true, dietary: true, nutrition: true });
});
test('farewell waits for speech or its safety timeout and distinguishes a new request from goodbye', () => {
  const farewell = new FarewellTracker();
  farewell.sent();
  assert.equal(farewell.done(false), false);
  assert.equal(farewell.shouldCancel('cảm ơn', Date.now() + 1000), false);
  assert.equal(farewell.shouldCancel('Khoan, đổi bữa tối giúp mình', Date.now() + 1000), true);
});
test('call automatically ends at five minutes and releases the mic', async (t) => {
  t.mock.timers.enable({ apis: ['setTimeout', 'setInterval', 'Date'] });
  const { call, events } = fixture(t);
  await connect(call);
  t.mock.timers.tick(299999);
  assert.equal(audio.stopCount, 0);
  t.mock.timers.tick(1);
  assert.equal(audio.stopCount, 1);
  assert.equal(events.statuses.at(-1), 'ended');
});
test('backend endCall speaks its summary before closing, with a safety timeout', async (t) => {
  t.mock.timers.enable({ apis: ['setTimeout', 'setInterval', 'Date'] });
  const { call, events } = fixture(t);
  turnHandler = async (_, __, emit) => {
    emit({ type: 'data-end-call', data: {} });
    emit({ type: 'data-summary', data: { text: 'Tạm biệt bạn.' } });
    emit({ type: 'finish' });
  };
  const socket = await connect(call); delegate(socket); await tick();
  assert.equal(socket.sent.at(-1).content, 'Tạm biệt bạn.');
  assert.equal(audio.stopCount, 0);
  t.mock.timers.tick(6200);
  assert.equal(events.statuses.at(-1), 'ended');
  assert.equal(audio.stopCount, 1);
});
test('a new delegation cancels the old turn and ignores its late screen commands', async (t) => {
  const { call, events } = fixture(t);
  let oldSignal, emitOld, finishOld;
  turnHandler = (_, signal, emit) => {
    oldSignal = signal; emitOld = emit;
    return new Promise((resolve) => { finishOld = resolve; });
  };
  const socket = await connect(call); delegate(socket); await tick();
  let secondMessage;
  turnHandler = async (input, _, emit) => { secondMessage = input.message; emit({ type: 'finish' }); };
  socket.emit({ type: 'transcript-fragment', speaker: 'user', delta: 'Đổi sang bún chay.', startMs: 3500, endMs: 4000 });
  socket.emit({ type: 'delegation-created', delegationId: 'delegation-2', offsetMs: 3600 });
  await tick();
  assert.equal(oldSignal.aborted, true);
  emitOld({ type: 'data-screen', data: { focus: { kind: 'bodyMetrics' }, close: null } });
  finishOld(); await tick();
  assert.equal(secondMessage, 'Đổi sang bún chay.');
  assert.equal(events.screens.length, 0);
  assert.equal(events.refreshes.some((change) => change.plan && change.log), true);
});
