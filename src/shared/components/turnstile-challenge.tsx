import { useMemo } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';

import { TURNSTILE_ORIGIN, TURNSTILE_SITE_KEY } from '@/shared/config/env';

export type TurnstileChallengeProps = {
  onToken: (token: string) => void;
  /** Called on widget error, timeout or when a solved token expires. */
  onFailure: (message: string) => void;
};

function buildHtml(siteKey: string) {
  return `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1">
<script src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit" async defer></script>
<style>html,body{margin:0;background:transparent;display:flex;justify-content:center;align-items:center;height:100%}</style></head>
<body><div id="w"></div><script>
function post(m){window.ReactNativeWebView.postMessage(JSON.stringify(m))}
var t=setInterval(function(){if(window.turnstile){clearInterval(t);
window.turnstile.render('#w',{sitekey:${JSON.stringify(siteKey)},
callback:function(k){post({type:'token',token:k})},
'error-callback':function(){post({type:'failure',message:'Xác minh bảo mật gặp lỗi. Vui lòng thử lại.'})},
'expired-callback':function(){post({type:'failure',message:'Xác minh đã hết hạn. Vui lòng xác minh lại.'})},
'timeout-callback':function(){post({type:'failure',message:'Xác minh quá thời gian. Vui lòng thử lại.'})}})}},100);
</script></body></html>`;
}

/** Cloudflare Turnstile in a WebView. Remount (change `key`) to get a fresh challenge. */
export function TurnstileChallenge({ onToken, onFailure }: TurnstileChallengeProps) {
  const html = useMemo(() => buildHtml(TURNSTILE_SITE_KEY), []);

  if (!TURNSTILE_SITE_KEY) {
    return <Text style={styles.missing}>Thiếu cấu hình xác minh bảo mật (EXPO_PUBLIC_TURNSTILE_SITE_KEY).</Text>;
  }

  function handleMessage(event: WebViewMessageEvent) {
    try {
      const message = JSON.parse(event.nativeEvent.data) as { type: string; token?: string; message?: string };
      if (message.type === 'token' && message.token) onToken(message.token);
      else if (message.type === 'failure') onFailure(message.message ?? 'Xác minh không thành công.');
    } catch {
      onFailure('Xác minh không thành công.');
    }
  }

  return (
    <View style={styles.frame}>
      <WebView
        originWhitelist={['*']}
        source={{ html, baseUrl: TURNSTILE_ORIGIN }}
        onMessage={handleMessage}
        onError={() => onFailure('Không tải được xác minh bảo mật. Kiểm tra kết nối và thử lại.')}
        startInLoadingState
        renderLoading={() => <ActivityIndicator style={StyleSheet.absoluteFill} />}
        javaScriptEnabled
        scrollEnabled={false}
        style={styles.webview}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { height: 72, width: '100%', overflow: 'hidden' },
  webview: { backgroundColor: 'transparent' },
  missing: { color: '#b91c1c', fontSize: 13 },
});
