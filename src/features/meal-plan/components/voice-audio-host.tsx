import { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { audioBridgeMessageSchema, type VoiceAudioPort } from '../types/voice-audio-bridge.schema';
import { connectVoiceAudioHost, failVoiceAudioHost, receiveVoiceAudioMessage } from '../services/voice-audio';
import { VOICE_AUDIO_HTML, VOICE_AUDIO_ORIGIN } from '../utils/voice-audio-html';

const source = { html: VOICE_AUDIO_HTML, baseUrl: VOICE_AUDIO_ORIGIN };

export function VoiceAudioHost() {
  // WebView 14's default undefined generic collapses its props under strict null checks.
  const view = useRef<WebView<unknown>>(null);
  const disconnect = useRef<(() => void) | undefined>(undefined);
  const port = useRef<VoiceAudioPort | undefined>(undefined);
  useEffect(() => {
    if (port.current) disconnect.current = connectVoiceAudioHost(port.current);
    return () => { disconnect.current?.(); disconnect.current = undefined; };
  }, []);
  const failed = () => { port.current = undefined; disconnect.current?.(); disconnect.current = undefined; failVoiceAudioHost(); };
  return (
    <View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={styles.host}>
      <WebView<unknown>
        ref={view}
        source={source}
        originWhitelist={['*']}
        onShouldStartLoadWithRequest={(request) => request.url === VOICE_AUDIO_ORIGIN || request.url === 'about:blank'}
        javaScriptEnabled
        domStorageEnabled={false}
        mediaPlaybackRequiresUserAction={false}
        allowsInlineMediaPlayback
        mediaCapturePermissionGrantType="grant"
        onError={failed}
        onRenderProcessGone={failed}
        onContentProcessDidTerminate={failed}
        onMessage={(event) => {
          try {
            const parsed = audioBridgeMessageSchema.safeParse(JSON.parse(event.nativeEvent.data));
            if (!parsed.success) return;
            if (parsed.data.type === 'ready') {
              disconnect.current?.();
              port.current = { send: (command) => {
                if (!view.current) throw new Error('Mic realtime đã đóng.');
                view.current.injectJavaScript(`window.vedoraVoice?.(${JSON.stringify(command).replace(/</g, '\\u003c')});true;`);
              } };
              disconnect.current = connectVoiceAudioHost(port.current);
            } else receiveVoiceAudioMessage(parsed.data);
          } catch { failed(); }
        }}
      />
    </View>
  );
}

// Keep the audio document mounted and visible to WebKit without covering native controls.
const styles = StyleSheet.create({ host: { position: 'absolute', bottom: 0, left: 0, width: 1, height: 1, overflow: 'hidden' } });
