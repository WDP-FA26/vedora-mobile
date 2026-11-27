import type { VoiceNoiseGate } from './voice-noise-gate';

/** Gateway Live uses mono signed PCM16 little-endian at 24 kHz on both platforms. */
export const VOICE_SAMPLE_RATE = 24_000;

/** Wrap Gateway's mono PCM16 bytes in a WAV container that Expo Audio can play. */
export function pcm16Wav(chunks: Uint8Array[]) {
  const size = chunks.reduce((sum, chunk) => sum + chunk.byteLength, 0);
  if (size % 2) throw new Error('Invalid PCM16 audio');
  const wav = new Uint8Array(44 + size);
  const view = new DataView(wav.buffer);
  const text = (offset: number, value: string) => {
    for (let i = 0; i < value.length; i++) wav[offset + i] = value.charCodeAt(i);
  };
  text(0, 'RIFF');
  view.setUint32(4, 36 + size, true);
  text(8, 'WAVEfmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, VOICE_SAMPLE_RATE, true);
  view.setUint32(28, VOICE_SAMPLE_RATE * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  text(36, 'data');
  view.setUint32(40, size, true);
  let offset = 44;
  for (const chunk of chunks) { wav.set(chunk, offset); offset += chunk.byteLength; }
  return wav;
}
export function pcm16Base64(samples: Float32Array, sourceRate = VOICE_SAMPLE_RATE, gate?: VoiceNoiseGate) {
  const ratio = sourceRate / VOICE_SAMPLE_RATE;
  const count = Math.floor(samples.length / ratio);
  let bytes = '';
  const pcm = new Int16Array(count);
  for (let i = 0; i < count; i++) {
    const pos = i * ratio;
    const left = Math.floor(pos);
    const a = samples[left] ?? 0;
    const b = samples[Math.min(left + 1, samples.length - 1)] ?? a;
    const sample = Math.max(-1, Math.min(1, a + (b - a) * (pos - left)));
    const value = Math.round(sample * (sample < 0 ? 32768 : 32767));
    pcm[i] = value;
  }
  const open = !gate || gate.processSamples(pcm);
  for (const value of pcm) bytes += open ? String.fromCharCode(value & 255, (value >> 8) & 255) : '\0\0';
  return btoa(bytes);
}

export type VoiceAudio = {
  canListenWhileSpeaking: boolean;
  start: (onAudio: (audio: string) => void, onError: (error: Error) => void) => Promise<void>;
  play: (audio: string) => void;
  interrupt: () => void;
  stop: () => Promise<void>;
  isPlaying: () => boolean;
};
