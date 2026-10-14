import '@/global.css';

import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { useColorScheme } from 'react-native';

import { VedoraThemeProvider } from '@/components/vedora-theme-provider';
import { Colors } from '@/constants/theme';
import { AppQueryProvider } from '@/shared/query/app-query-provider';
import { hydrateSession } from '@/shared/api/api-client';
import { useSessionStore } from '@/shared/stores/session-store';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const isHydrated = useSessionStore((state) => state.isHydrated);
  const [fontsLoaded, fontError] = useFonts({
    SourceSans3_400Regular: require('@expo-google-fonts/source-sans-3/400Regular/SourceSans3_400Regular.ttf'),
    SourceSans3_500Medium: require('@expo-google-fonts/source-sans-3/500Medium/SourceSans3_500Medium.ttf'),
    SourceSans3_600SemiBold: require('@expo-google-fonts/source-sans-3/600SemiBold/SourceSans3_600SemiBold.ttf'),
    SourceSans3_700Bold: require('@expo-google-fonts/source-sans-3/700Bold/SourceSans3_700Bold.ttf'),
    BeVietnamPro_500Medium: require('@expo-google-fonts/be-vietnam-pro/500Medium/BeVietnamPro_500Medium.ttf'),
    BeVietnamPro_600SemiBold: require('@expo-google-fonts/be-vietnam-pro/600SemiBold/BeVietnamPro_600SemiBold.ttf'),
    BeVietnamPro_700Bold: require('@expo-google-fonts/be-vietnam-pro/700Bold/BeVietnamPro_700Bold.ttf'),
    BeVietnamPro_800ExtraBold: require('@expo-google-fonts/be-vietnam-pro/800ExtraBold/BeVietnamPro_800ExtraBold.ttf'),
    Figtree_400Regular: require('@expo-google-fonts/figtree/400Regular/Figtree_400Regular.ttf'),
    GeistMono_400Regular: require('@expo-google-fonts/geist-mono/400Regular/GeistMono_400Regular.ttf'),
  });

  useEffect(() => {
    void hydrateSession().catch(() => undefined);
  }, []);

  const isReady = (fontsLoaded || !!fontError) && isHydrated;
  useEffect(() => {
    if (isReady) void SplashScreen.hideAsync();
  }, [isReady]);

  if (!isReady) return null;

  const colors = Colors[colorScheme === 'dark' ? 'dark' : 'light'];
  const navigationTheme = colorScheme === 'dark' ? DarkTheme : DefaultTheme;

  return (
    <AppQueryProvider>
      <VedoraThemeProvider>
        <ThemeProvider
          value={{
            ...navigationTheme,
            colors: {
              ...navigationTheme.colors,
              primary: colors.primary,
              background: colors.background,
              card: colors.card,
              text: colors.foreground,
              border: colors.border,
            },
          }}>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="explore" />
            <Stack.Screen name="login" />
            <Stack.Screen name="register" />
            <Stack.Screen name="verify-email" />
          </Stack>
        </ThemeProvider>
      </VedoraThemeProvider>
    </AppQueryProvider>
  );
}
