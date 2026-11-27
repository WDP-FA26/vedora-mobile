import { pcm16Base64, VOICE_SAMPLE_RATE, type VoiceAudio } from '../utils/voice-audio';
import { VoiceNoiseGate } from '../utils/voice-noise-gate';

export async function createVoiceAudio(): Promise<VoiceAudio> {
  let stream: MediaStream | undefined;
  let context: AudioContext | undefined;
  let processor: ScriptProcessorNode | undefined;
  let input: MediaStreamAudioSourceNode | undefined;
  let stopped = false;
  let until = 0;
  const sources = new Set<AudioBufferSourceNode>();
  const gate = new VoiceNoiseGate();
  const interrupt = () => { for (const source of sources) source.stop(); sources.clear(); until = 0; };
  return {
    canListenWhileSpeaking: true,
    async start(onAudio, onError) {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error('Trình duyệt cần HTTPS và quyền mic để gọi giọng nói.');
      context = new AudioContext({ sampleRate: VOICE_SAMPLE_RATE });
      await context.resume();
      stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } });
      if (stopped) { stream.getTracks().forEach((track) => track.stop()); await context.close(); return; }
      stream.getAudioTracks().forEach((track) => { track.onended = () => { if (!stopped) onError(new Error('Mic bị ngắt kết nối.')); }; });
      input = context.createMediaStreamSource(stream);
      // ScriptProcessor supports Safari as well as Chromium without shipping a separate worklet asset.
      processor = context.createScriptProcessor(1024, 1, 1);
      processor.onaudioprocess = (event) => { if (!stopped) onAudio(pcm16Base64(event.inputBuffer.getChannelData(0), event.inputBuffer.sampleRate, gate)); };
      input.connect(processor);
      processor.connect(context.destination);
    },
    play(audio) {
      if (!context || stopped) return;
      if (until - context.currentTime > 60) throw new Error('Âm thanh bị chậm. Hãy kết nối lại cuộc gọi.');
      const raw = atob(audio);
      const view = new DataView(new ArrayBuffer(raw.length));
      for (let i = 0; i < raw.length; i++) view.setUint8(i, raw.charCodeAt(i));
      const buffer = context.createBuffer(1, Math.floor(raw.length / 2), VOICE_SAMPLE_RATE);
      const samples = buffer.getChannelData(0);
      for (let i = 0; i < samples.length; i++) samples[i] = view.getInt16(i * 2, true) / 32768;
      const source = context.createBufferSource();
      source.buffer = buffer;
      source.connect(context.destination);
      sources.add(source);
      source.onended = () => { sources.delete(source); source.disconnect(); };
      until = Math.max(context.currentTime, until);
      source.start(until);
      until += buffer.duration;
    },
    interrupt,
    isPlaying: () => !!context && until > context.currentTime,
    async stop() {
      stopped = true;
      if (processor) { processor.onaudioprocess = null; processor.disconnect(); }
      input?.disconnect();
      stream?.getTracks().forEach((track) => track.stop());
      interrupt();
      if (context?.state !== 'closed') await context?.close();
    },
  };
}
