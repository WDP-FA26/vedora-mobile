import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { Fonts, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { ApiError } from '@/shared/api/api-error';

import { useGoogleLogin } from '../hooks/use-google-login';
import { AuthMessage } from './auth-ui';

export function GoogleButton({ returnTo, disabled, onBusyChange }: {
  returnTo: string;
  disabled: boolean;
  onBusyChange: (busy: boolean) => void;
}) {
  const theme = useTheme();
  const login = useGoogleLogin();
  const [error, setError] = useState('');

  async function submit() {
    if (disabled || login.isPending) return;
    setError('');
    onBusyChange(true);
    try {
      const destination = await login.mutateAsync(returnTo);
      if (destination) router.replace(destination);
    } catch (cause) {
      setError(cause instanceof Error && cause.message === 'GOOGLE_NATIVE_BUILD_REQUIRED'
        ? 'Đăng nhập Google cần bản cài Vedora trên điện thoại (development build hoặc bản phát hành). Hãy dùng email khi đang thử bằng Expo Go hoặc trình duyệt.'
        : cause instanceof ApiError && cause.status === 503
          ? 'Đăng nhập Google chưa được bật trên máy chủ. Vui lòng dùng email hoặc thử lại sau.'
          : cause instanceof ApiError && cause.status === null
            ? 'Không thể kết nối. Kiểm tra mạng rồi thử lại.'
            : 'Chưa thể đăng nhập Google. Vui lòng thử lại; nếu lỗi tiếp diễn, hãy dùng email.');
    } finally { onBusyChange(false); }
  }

  return (
    <View style={styles.group}>
      <Pressable accessibilityRole="button" accessibilityLabel="Tiếp tục với Google"
        accessibilityState={{ disabled: disabled || login.isPending, busy: login.isPending }}
        disabled={disabled || login.isPending} onPress={submit}
        style={({ pressed }) => [styles.button, { backgroundColor: theme.card, borderColor: theme.border, opacity: disabled || pressed ? 0.6 : 1 }]}>
        {login.isPending ? <ActivityIndicator color={theme.primary} /> : <Image source={require('@/assets/branding/google.svg')} style={styles.logo} accessible={false} />}
        <Text style={[styles.label, { color: theme.foreground }]}>{login.isPending ? 'Đang kết nối Google…' : 'Tiếp tục với Google'}</Text>
      </Pressable>
      {error ? <AuthMessage message={error} error /> : null}
      <View style={styles.divider} accessible={false}>
        <View style={[styles.line, { backgroundColor: theme.border }]} />
        <Text style={[styles.or, { color: theme.mutedForeground }]}>hoặc dùng email</Text>
        <View style={[styles.line, { backgroundColor: theme.border }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  group: { gap: Spacing.three },
  button: { minHeight: 50, borderWidth: 1, borderRadius: Radius.xl, padding: Spacing.two, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.two },
  logo: { width: 22, height: 22 },
  label: { fontFamily: Fonts.sansSemibold, fontSize: 15, flexShrink: 1 },
  divider: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  line: { height: 1, flex: 1 },
  or: { fontFamily: Fonts.sans, fontSize: 13 },
});
