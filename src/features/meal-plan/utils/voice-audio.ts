import type { VoiceNoiseGate } from './voice-noise-gate';

/** Gateway Live uses mono signed PCM16 little-endian at 24 kHz on both platforms. */
export const VOICE_SAMPLE_RATE = 24_000;
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
  start: (onAudio: (audio: string) => void, onError: (error: Error) => void) => Promise<void>;
  play: (audio: string) => void;
  interrupt: () => void;
  stop: () => Promise<void>;
  isPlaying: () => boolean;
};
