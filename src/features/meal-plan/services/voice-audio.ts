import { AudioModule, createAudioPlaylist, requestRecordingPermissionsAsync, setAudioModeAsync, setIsAudioActiveAsync, type AudioPlaylist, type AudioStream } from 'expo-audio';
import { File, Paths } from 'expo-file-system';
import { pcm16Base64, pcm16Wav, VOICE_SAMPLE_RATE, type VoiceAudio } from '../utils/voice-audio';
import { VoiceNoiseGate } from '../utils/voice-noise-gate';

let activeAudio: VoiceAudio | undefined;

/** Expo Go SDK 58 provides PCM capture; WAV batches use its gapless playlist for playback. */
export async function createVoiceAudio(): Promise<VoiceAudio> {
  while (activeAudio) await activeAudio.stop();
  const native = AudioModule;
  if (!native.AudioStream) throw new Error('Hãy cập nhật Expo Go tương thích SDK 58 để dùng mic giọng nói.');
  const gate = new VoiceNoiseGate();
  let stopped = false;
  let starting: Promise<void> | undefined;
  let cleanup: Promise<void> | undefined;
  let stream: AudioStream | undefined;
  let playlist: AudioPlaylist | undefined;
  let flushTimer: ReturnType<typeof setTimeout> | undefined;
  let resumeTimer: ReturnType<typeof setTimeout> | undefined;
  let silenceTimer: ReturnType<typeof setInterval> | undefined;
  let watchdog: ReturnType<typeof setInterval> | undefined;
  let transition = Promise.resolve();
  let recording = false;
  let playbackReady = false;
  let receivedBuffer = false;
  let lastBuffer = 0;
  let lastProgress = 0;
  let quietUntil = 0;
  let sequence = 0;
  let chunks: Uint8Array[] = [];
  let pendingBytes = 0;
  let files: { file: File; duration: number }[] = [];
  let onFailure: (error: Error) => void = () => undefined;
  const subscriptions: { remove: () => void }[] = [];
  const prefix = `vedora-voice-${Date.now()}-`;
  const silentFrame = pcm16Base64(new Float32Array(VOICE_SAMPLE_RATE / 10));
  const playing = () => pendingBytes > 0 || files.length > 0 || Date.now() < quietUntil;
  const pauseCapture = async () => {
    if (!recording || !stream) return;
    recording = false;
    try { stream.stop(); }
    finally {
      // SDK 58 schedules iOS session deactivation 100ms after stop and does not track PCM streams.
      await new Promise<void>((resolve) => setTimeout(resolve, 150));
    }
  };
  const syncMode = () => {
    transition = transition.then(async () => {
      if (stopped || !stream) return;
      if (playing()) {
        // iOS AudioStream starts in record-only mode. Stop its engine before changing the session.
        await pauseCapture();
        if (stopped) return;
        if (!playbackReady) {
          await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true, interruptionMode: 'doNotMix', shouldPlayInBackground: false, allowsBackgroundRecording: false });
          if (stopped) return;
          await setIsAudioActiveAsync(true);
          playbackReady = true;
        }
        if (!stopped && files.length) playlist?.play();
      } else if (!recording) {
        playbackReady = false;
        // Configure before start: changing the category afterwards can stop AVAudioEngine's buffers.
        await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true, interruptionMode: 'doNotMix', shouldRouteThroughEarpiece: false, shouldPlayInBackground: false, allowsBackgroundRecording: false });
        if (stopped) return;
        await setIsAudioActiveAsync(true);
        if (stopped) return;
        receivedBuffer = false;
        lastBuffer = Date.now();
        recording = true;
        await stream.start();
      }
    });
    return transition;
  };
  const resumeCapture = () => {
    clearTimeout(resumeTimer);
    resumeTimer = setTimeout(() => {
      resumeTimer = undefined;
      if (!stopped && !pendingBytes && !files.length) void syncMode().catch(() => {
        if (!stopped) onFailure(new Error('Chưa mở lại được mic. Hãy kết nối lại cuộc gọi.'));
      });
    }, Math.max(0, quietUntil - Date.now()));
  };
  const deleteFiles = () => {
    for (const { file } of files) {
      try { if (file.exists) file.delete(); } catch { /* The OS may already have evicted a cache file. */ }
    }
    files = [];
  };
  const interrupt = () => {
    clearTimeout(flushTimer);
    flushTimer = undefined;
    chunks = [];
    pendingBytes = 0;
    try { playlist?.clear(); }
    finally { deleteFiles(); quietUntil = Date.now() + 200; if (!stopped) resumeCapture(); }
  };
  const flush = () => {
    flushTimer = undefined;
    if (stopped || !pendingBytes || !playlist) return;
    try {
      const wav = pcm16Wav(chunks);
      const duration = pendingBytes / (VOICE_SAMPLE_RATE * 2);
      chunks = [];
      pendingBytes = 0;
      const file = new File(Paths.cache, `${prefix}${sequence++}.wav`);
      files.push({ file, duration });
      file.writeSync(wav);
      playlist.add({ uri: file.uri });
      void syncMode().catch(() => {
        if (!stopped) onFailure(new Error('Không mở được loa trợ lý. Hãy gọi lại.'));
      });
    } catch {
      onFailure(new Error('Không phát được âm thanh trợ lý. Hãy gọi lại.'));
    }
  };
  const audio: VoiceAudio = {
    canListenWhileSpeaking: false,
    start(onAudio, onError) {
      onFailure = onError;
      starting = (async () => {
        if (!(await requestRecordingPermissionsAsync()).granted) throw new Error('Hãy cho phép Expo Go dùng mic trong Cài đặt để trò chuyện.');
        if (stopped) return;
        playlist = createAudioPlaylist({ updateInterval: 100, loop: 'none' });
        subscriptions.push(playlist.addListener('playlistStatusUpdate', (status) => {
          if (stopped) return;
          if ('error' in status && status.error) { onFailure(new Error('Loa bị gián đoạn. Hãy kết nối lại cuộc gọi.')); return; }
          if (status.playing) lastProgress = Date.now();
          if (status.didJustFinish && status.trackCount === files.length && status.currentIndex === files.length - 1) {
            playlist?.clear();
            deleteFiles();
            quietUntil = Date.now() + 200;
            resumeCapture();
          }
        }));
        stream = new native.AudioStream({ sampleRate: VOICE_SAMPLE_RATE, channels: 1, encoding: 'float32' });
        subscriptions.push(stream.addListener('audioStreamBuffer', (buffer) => {
          if (stopped || !recording) return;
          lastBuffer = Date.now();
          if (buffer.channels !== 1 || buffer.data.byteLength % 4 || !Number.isFinite(buffer.sampleRate) || buffer.sampleRate <= 0) {
            onFailure(new Error('Định dạng mic không tương thích. Hãy thử thiết bị âm thanh khác.'));
            return;
          }
          receivedBuffer = true;
          // shortcut: Expo has no stream AEC; alternate listening/playback until voice processing is available.
          const samples = playing() ? new Float32Array(buffer.data.byteLength / 4) : new Float32Array(buffer.data);
          onAudio(pcm16Base64(samples, buffer.sampleRate, gate));
        }));
        await syncMode();
        if (stopped) return;
        lastProgress = Date.now();
        // Keep Gateway's input timeline moving during intentional mic pauses and the speaker tail.
        silenceTimer = setInterval(() => { if (!stopped && !recording) onAudio(silentFrame); }, 100);
        watchdog = setInterval(() => {
          if (stopped) return;
          // Status snapshots also report intentional stops; PCM delivery is the health signal.
          if (recording && Date.now() - lastBuffer > (receivedBuffer ? 3000 : 8000)) onFailure(new Error(receivedBuffer
            ? 'Mic bị gián đoạn. Hãy kết nối lại cuộc gọi.'
            : 'Chưa nhận được âm thanh từ mic. Hãy kiểm tra quyền mic của Expo Go và thiết bị âm thanh.'));
          else if (files.length && Date.now() - lastProgress > 15_000) onFailure(new Error('Âm thanh bị chậm. Hãy kết nối lại cuộc gọi.'));
        }, 1000);
      })();
      return starting;
    },
    play(encoded) {
      if (stopped) return;
      const raw = atob(encoded);
      if (!raw.length) return;
      if (raw.length % 2) throw new Error('Invalid PCM16 audio');
      const outstanding = files.slice(playlist?.currentIndex ?? 0).reduce((sum, item) => sum + item.duration, 0) - (playlist?.currentTime ?? 0);
      if (Math.max(0, outstanding) + (pendingBytes + raw.length) / (VOICE_SAMPLE_RATE * 2) > 60) throw new Error('Âm thanh bị chậm. Hãy kết nối lại cuộc gọi.');
      if (!files.length && !pendingBytes) lastProgress = Date.now();
      chunks.push(Uint8Array.from(raw, (char) => char.charCodeAt(0)));
      pendingBytes += raw.length;
      // Batch small Gateway frames, and flush the final short batch even if no more frames arrive.
      if (!flushTimer) flushTimer = setTimeout(flush, 240);
    },
    interrupt,
    isPlaying: () => !stopped && playing(),
    stop() {
      if (cleanup) return cleanup;
      stopped = true;
      clearInterval(watchdog);
      clearInterval(silenceTimer);
      clearTimeout(resumeTimer);
      clearTimeout(flushTimer);
      chunks = [];
      pendingBytes = 0;
      try { playlist?.clear(); } catch { /* Still release resources if the audio route disappeared. */ }
      cleanup = (async () => {
        try {
          await starting?.catch(() => undefined);
          await transition.catch(() => undefined);
          // A disconnected device can throw during teardown; still release every other resource.
          for (const release of [...subscriptions.map((subscription) => () => subscription.remove()), () => playlist?.destroy(), pauseCapture, () => stream?.release()]) {
            try { await release(); } catch { /* Continue releasing the remaining resources. */ }
          }
          deleteFiles();
        } finally {
          try {
            await setIsAudioActiveAsync(false).catch(() => undefined);
            await setAudioModeAsync({ allowsRecording: false, interruptionMode: 'mixWithOthers' }).catch(() => undefined);
          } finally {
            if (activeAudio === audio) activeAudio = undefined;
          }
        }
      })();
      return cleanup;
    },
  };
  activeAudio = audio;
  return audio;
}
