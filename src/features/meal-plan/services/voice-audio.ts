import { requestRecordingPermissionsAsync } from 'expo-audio';
import type { AudioBridgeMessage, VoiceAudioPort } from '../types/voice-audio-bridge.schema';
import type { VoiceAudio } from '../utils/voice-audio';
import { VoiceNoiseGate } from '../utils/voice-noise-gate';

let host: VoiceAudioPort | undefined;
let activeAudio: RealtimeAudio | undefined;
let nextId = 0;
const waiting = new Set<(port: VoiceAudioPort) => void>();

export function connectVoiceAudioHost(port: VoiceAudioPort) {
  if (host && host !== port) activeAudio?.fail('Luồng mic đã thay đổi. Hãy kết nối lại cuộc gọi.');
  host = port;
  for (const ready of [...waiting]) ready(port);
  return () => {
    if (host !== port) return;
    host = undefined;
    failVoiceAudioHost();
  };
}

export function failVoiceAudioHost() {
  activeAudio?.fail('Âm thanh realtime bị gián đoạn. Hãy kết nối lại cuộc gọi.');
}

export function receiveVoiceAudioMessage(message: AudioBridgeMessage) {
  if (message.type !== 'ready') activeAudio?.receive(message);
}

function waitForHost(signal: AbortSignal): Promise<VoiceAudioPort> {
  if (signal.aborted) return Promise.reject(new Error('Cuộc gọi đã kết thúc.'));
  if (host) return Promise.resolve(host);
  return new Promise((resolve, reject) => {
    const finish = (port?: VoiceAudioPort) => {
      clearTimeout(timer); waiting.delete(ready); signal.removeEventListener('abort', cancel);
      if (port) resolve(port); else reject(new Error('Chưa mở được mic realtime. Hãy kết nối lại cuộc gọi.'));
    };
    const ready = (port: VoiceAudioPort) => finish(port);
    const cancel = () => finish();
    const timer = setTimeout(cancel, 10_000);
    waiting.add(ready); signal.addEventListener('abort', cancel, { once: true });
  });
}

const errors = {
  permission: 'Hãy cho phép Expo Go dùng mic trong Cài đặt để trò chuyện.',
  'missing-mic': 'Chưa tìm thấy mic. Hãy kiểm tra thiết bị âm thanh và thử lại.',
  unsupported: 'Thiết bị chưa mở được mic realtime. Hãy cập nhật Expo Go và thử lại.',
  interrupted: 'Mic bị gián đoạn. Hãy kết nối lại cuộc gọi.',
  playback: 'Không phát được âm thanh trợ lý. Hãy kết nối lại cuộc gọi.',
};

/** Only PCM crosses the local WebView bridge. Auth, Gateway and Planner stay in React Native. */
class RealtimeAudio implements VoiceAudio {
  readonly canListenWhileSpeaking = true;
  private id = ++nextId;
  private stopped = false;
  private playing = false;
  private sequence = 0;
  private port?: VoiceAudioPort;
  private setup = new AbortController();
  private gate = new VoiceNoiseGate();
  private starting?: Promise<void>;
  private cleanup?: Promise<void>;
  private resolveStart?: () => void;
  private rejectStart?: (error: Error) => void;
  private resolveStop?: () => void;
  private startupTimer?: ReturnType<typeof setTimeout>;
  private watchdog?: ReturnType<typeof setInterval>;
  private lastInput = 0;
  private receivedInput = false;
  private onAudio: (audio: string) => void = () => undefined;
  private onError: (error: Error) => void = () => undefined;

  start(onAudio: (audio: string) => void, onError: (error: Error) => void) {
    if (this.starting) return this.starting;
    this.onAudio = onAudio; this.onError = onError;
    this.starting = this.open();
    return this.starting;
  }
  private async open() {
    if (!(await requestRecordingPermissionsAsync()).granted) throw new Error(errors.permission);
    if (this.stopped) return;
    this.port = await waitForHost(this.setup.signal);
    if (this.stopped) return;
    await new Promise<void>((resolve, reject) => {
      this.resolveStart = () => { clearTimeout(this.startupTimer); resolve(); };
      this.rejectStart = (error) => { clearTimeout(this.startupTimer); reject(error); };
      this.startupTimer = setTimeout(() => reject(new Error('Chưa nhận được âm thanh từ mic realtime. Hãy kết nối lại cuộc gọi.')), 30_000);
      this.port!.send({ type: 'start', id: this.id });
    });
    this.resolveStart = undefined; this.rejectStart = undefined;
    if (this.stopped) return;
    this.lastInput = Date.now();
    this.watchdog = setInterval(() => {
      if (Date.now() - this.lastInput > (this.receivedInput ? 3000 : 8000)) this.fail(errors.interrupted);
    }, 1000);
  }
  receive(message: Exclude<AudioBridgeMessage, { type: 'ready' }>) {
    if (message.id !== this.id) return;
    if (message.type === 'stopped') { this.resolveStop?.(); return; }
    if (this.stopped) return;
    if (message.type === 'started') { this.resolveStart?.(); return; }
    if (message.type === 'error') { this.fail(errors[message.code]); return; }
    if (message.type === 'playback') {
      if (message.sequence === this.sequence) this.playing = message.playing;
      return;
    }
    const raw = atob(message.audio);
    if (raw.length % 2) { this.fail('Định dạng mic không tương thích. Hãy kết nối lại cuộc gọi.'); return; }
    this.lastInput = Date.now(); this.receivedInput = true;
    const pcm = new Int16Array(raw.length / 2);
    for (let i = 0; i < pcm.length; i++) pcm[i] = raw.charCodeAt(i * 2) | raw.charCodeAt(i * 2 + 1) << 8;
    this.onAudio(this.gate.processSamples(pcm) ? message.audio : btoa('\0'.repeat(raw.length)));
  }
  play(audio: string) {
    if (this.stopped || !audio) return;
    if (audio.length > 524_288 || audio.length % 4 || !/^[A-Za-z0-9+/]+={0,2}$/.test(audio) || atob(audio).length % 2) throw new Error('Invalid PCM16 audio');
    this.playing = true;
    this.port?.send({ type: 'play', id: this.id, sequence: ++this.sequence, audio });
  }
  interrupt() {
    if (this.stopped) return;
    this.playing = false;
    this.port?.send({ type: 'interrupt', id: this.id, sequence: ++this.sequence });
  }
  isPlaying() { return !this.stopped && this.playing; }
  fail(message: string) {
    if (this.stopped) return;
    this.setup.abort(); this.rejectStart?.(new Error(message));
    this.onError(new Error(message));
    void this.stop();
  }
  stop(): Promise<void> {
    if (this.cleanup) return this.cleanup;
    this.stopped = true; this.playing = false;
    this.setup.abort(); this.rejectStart?.(new Error('Cuộc gọi đã kết thúc.'));
    clearTimeout(this.startupTimer); clearInterval(this.watchdog);
    this.cleanup = new Promise<void>((resolve) => {
      const finish = () => {
        clearTimeout(timer); this.resolveStop = undefined;
        if (activeAudio === this) activeAudio = undefined;
        resolve();
      };
      const timer = setTimeout(finish, 750);
      this.resolveStop = finish;
      if (!this.port) { finish(); return; }
      try { this.port.send({ type: 'stop', id: this.id }); } catch { finish(); }
    });
    return this.cleanup;
  }
}

export async function createVoiceAudio(): Promise<VoiceAudio> {
  while (activeAudio) await activeAudio.stop();
  const audio = new RealtimeAudio();
  activeAudio = audio;
  return audio;
}
