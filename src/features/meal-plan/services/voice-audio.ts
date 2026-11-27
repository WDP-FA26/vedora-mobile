import { Platform } from 'react-native';
import { pcm16Base64, VOICE_SAMPLE_RATE, type VoiceAudio } from '../utils/voice-audio';
import { VoiceNoiseGate } from '../utils/voice-noise-gate';

/** Loaded only after the user starts a call, so Expo Go can still open the rest of the app. */
export async function createVoiceAudio(): Promise<VoiceAudio> {
  const { AudioContext, AudioRecorder, AudioManager } = await import('react-native-audio-api').catch(() => { throw new Error('Mic cần development build mới. Hãy cài lại bản Vedora có hỗ trợ giọng nói.'); });
  let stopped = false;
  const gate = new VoiceNoiseGate();
  let epoch = 0;
  let until = 0;
  let decoding = Promise.resolve();
  let onFailure: (error: Error) => void = () => undefined;
  let context: InstanceType<typeof AudioContext> | undefined;
  let queue: ReturnType<InstanceType<typeof AudioContext>['createBufferQueueSource']> | undefined;
  let recorder: InstanceType<typeof AudioRecorder> | undefined;
  const subscriptions: { remove: () => void }[] = [];
  return {
    async start(onAudio, onError) {
      onFailure = onError;
      if (await AudioManager.requestRecordingPermissions() !== 'Granted') throw new Error('Hãy cho phép Vedora dùng mic trong Cài đặt để trò chuyện.');
      if (stopped) return;
      AudioManager.setSystemOptions({
        ios: { category: 'playAndRecord', mode: 'voiceChat', options: ['defaultToSpeaker', 'allowBluetoothHFP'] },
        ...(Platform.OS === 'android' && Number(Platform.Version) >= 31 ? { android: { mode: 'inCommunication' as const, communicationDevice: 'systemDefault' as const } } : {}),
      });
      await AudioManager.setAudioSessionActivity(true);
      if (stopped) { await AudioManager.setAudioSessionActivity(false); return; }
      AudioManager.observeAudioInterruptions(true);
      subscriptions.push(AudioManager.addSystemEventListener('interruption', (event) => {
        if (!stopped && event.type === 'began') onFailure(new Error('Âm thanh bị gián đoạn bởi cuộc gọi hoặc ứng dụng khác. Hãy gọi lại khi sẵn sàng.'));
      }));
      subscriptions.push(AudioManager.addSystemEventListener('routeChange', (event) => {
        if (!stopped && event.reason === 'OldDeviceUnavailable') onFailure(new Error('Thiết bị âm thanh vừa bị ngắt. Hãy kết nối lại cuộc gọi.'));
      }));
      context = new AudioContext({ sampleRate: VOICE_SAMPLE_RATE, androidOutputProfile: 'voiceCommunication' });
      queue = context.createBufferQueueSource();
      queue.connect(context.destination);
      queue.start();
      recorder = new AudioRecorder({ androidInputPreset: 'voiceCommunication', iosVoiceProcessing: true });
      recorder.onError(() => onFailure(new Error('Mic bị gián đoạn. Hãy kết nối lại cuộc gọi.')));
      recorder.onAudioReady({ sampleRate: VOICE_SAMPLE_RATE, bufferLength: 480, channelCount: 1 }, ({ buffer, numFrames }) => {
        if (!stopped) onAudio(pcm16Base64(buffer.getChannelData(0).subarray(0, numFrames), buffer.sampleRate, gate));
      });
      const result = await recorder.start();
      if (stopped) { await recorder.stop(); return; }
      if (result.status !== 'success') throw new Error('Chưa mở được mic. Hãy kiểm tra quyền ghi âm và thử lại.');
    },
    play(audio) {
      const generation = epoch;
      decoding = decoding.then(async () => {
        if (stopped || generation !== epoch || !context || !queue) return;
        const buffer = await context.decodePCMInBase64(audio, VOICE_SAMPLE_RATE, 1);
        if (stopped || generation !== epoch) return;
        if (until - Date.now() > 60_000) throw new Error('Âm thanh bị chậm. Hãy kết nối lại cuộc gọi.');
        queue.enqueueBuffer(buffer);
        until = Math.max(until, Date.now()) + buffer.duration * 1000;
      }).catch((error: unknown) => { if (!stopped) onFailure(error instanceof Error ? error : new Error('Không phát được âm thanh.')); });
    },
    interrupt() { epoch++; queue?.clearBuffers(); until = 0; },
    isPlaying: () => until > Date.now(),
    async stop() {
      if (stopped) return;
      stopped = true;
      epoch++;
      subscriptions.forEach((subscription) => subscription.remove());
      AudioManager.observeAudioInterruptions(false);
      recorder?.clearOnAudioReady();
      recorder?.clearOnError();
      await recorder?.stop().catch(() => undefined);
      queue?.clearBuffers();
      queue?.stop();
      await context?.close().catch(() => undefined);
      await AudioManager.setAudioSessionActivity(false).catch(() => undefined);
    },
  };
}
