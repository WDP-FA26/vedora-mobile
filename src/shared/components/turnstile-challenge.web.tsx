import { useEffect, useRef } from 'react';
import { Text, View } from 'react-native';

import { TURNSTILE_SITE_KEY } from '@/shared/config/env';

import type { TurnstileChallengeProps } from './turnstile-challenge';

type TurnstileApi = {
  render: (el: HTMLElement, options: Record<string, unknown>) => string;
  remove: (id: string) => void;
};

const SCRIPT_URL = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
let scriptPromise: Promise<TurnstileApi> | null = null;

function loadTurnstile() {
  const win = window as unknown as { turnstile?: TurnstileApi };
  if (win.turnstile) return Promise.resolve(win.turnstile);
  scriptPromise ??= new Promise<TurnstileApi>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = SCRIPT_URL;
    script.async = true;
    script.onload = () => (win.turnstile ? resolve(win.turnstile) : reject(new Error('turnstile')));
    script.onerror = () => {
      scriptPromise = null;
      reject(new Error('turnstile'));
    };
    document.head.appendChild(script);
  });
  return scriptPromise;
}

/** Cloudflare Turnstile widget for the web platform. Remount (change `key`) to reset. */
export function TurnstileChallenge({ onToken, onFailure }: TurnstileChallengeProps) {
  const host = useRef<View>(null);
  const callbacks = useRef({ onToken, onFailure });
  useEffect(() => {
    callbacks.current = { onToken, onFailure };
  });

  useEffect(() => {
    if (!TURNSTILE_SITE_KEY) return;
    let widgetId: string | null = null;
    let api: TurnstileApi | null = null;
    let cancelled = false;
    loadTurnstile()
      .then((turnstile) => {
        const element = host.current as unknown as HTMLElement | null;
        if (cancelled || !element) return;
        api = turnstile;
        widgetId = turnstile.render(element, {
          sitekey: TURNSTILE_SITE_KEY,
          callback: (token: string) => callbacks.current.onToken(token),
          'error-callback': (code: unknown) => {
            callbacks.current.onFailure(`Xác minh bảo mật gặp lỗi (mã ${String(code)}). Vui lòng thử lại.`);
            return true;
          },
          'expired-callback': () => callbacks.current.onFailure('Xác minh đã hết hạn. Vui lòng xác minh lại.'),
          'timeout-callback': () => callbacks.current.onFailure('Xác minh quá thời gian. Vui lòng thử lại.'),
        });
      })
      .catch(() => callbacks.current.onFailure('Không tải được xác minh bảo mật. Kiểm tra kết nối và thử lại.'));
    return () => {
      cancelled = true;
      if (api && widgetId) api.remove(widgetId);
    };
  }, []);

  if (!TURNSTILE_SITE_KEY) {
    return <Text>Thiếu cấu hình xác minh bảo mật (EXPO_PUBLIC_TURNSTILE_SITE_KEY).</Text>;
  }
  return <View ref={host} style={{ minHeight: 72, alignItems: 'center' }} />;
}
