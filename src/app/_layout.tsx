import '@/global.css';

import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import AppTabs from '@/components/app-tabs';
import { VedoraThemeProvider } from '@/components/vedora-theme-provider';
import { Colors } from '@/constants/theme';

SplashScreen.preventAutoHideAsync();

export default function TabLayout() {
  const colorScheme = useColorScheme();
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

  if (!fontsLoaded && !fontError) return null;

  const colors = Colors[colorScheme === 'dark' ? 'dark' : 'light'];
  const navigationTheme = colorScheme === 'dark' ? DarkTheme : DefaultTheme;

  return (
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
        <AnimatedSplashOverlay />
        <AppTabs />
      </ThemeProvider>
    </VedoraThemeProvider>
  );
}
