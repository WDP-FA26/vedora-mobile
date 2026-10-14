// Keep these values in sync with vedora-frontend/app/globals.css.
export const BrandColors = {
  forest: '#255d32',
  leaf: '#398f3b',
  sprout: '#75b65c',
  teal: '#0b7472',
  aqua: '#a9f4ef',
  tomato: '#d84a3e',
  coral: '#e35a62',
  orange: '#f79b2d',
  lemon: '#f8d544',
  cream: '#ffe7b9',
  plum: '#9b1f59',
} as const;

export const SemanticColors = {
  light: {
    background: '#fafbf8',
    foreground: '#14261a',
    card: '#fffefa',
    cardForeground: '#14261a',
    popover: '#fffefa',
    popoverForeground: '#14261a',
    primary: '#255d32',
    primaryForeground: '#f6fbf2',
    secondary: '#e4f1dc',
    secondaryForeground: '#255d32',
    muted: '#f0f3ed',
    mutedForeground: '#5c6b5e',
    accent: '#e9f3e3',
    accentForeground: '#1e4b29',
    destructive: '#d84a3e',
    border: '#e3e8df',
    input: '#e3e8df',
    ring: '#398f3b',
    chart1: '#398f3b',
    chart2: '#0b7472',
    chart3: '#f79b2d',
    chart4: '#9b1f59',
    chart5: '#f8d544',
  },
  dark: {
    background: '#0f1a12',
    foreground: '#eef4ea',
    card: '#17251a',
    cardForeground: '#eef4ea',
    popover: '#17251a',
    popoverForeground: '#eef4ea',
    primary: '#75b65c',
    primaryForeground: '#0f2a15',
    secondary: '#22382a',
    secondaryForeground: '#ddefd3',
    muted: '#1e2d21',
    mutedForeground: '#9dae9f',
    accent: '#24402b',
    accentForeground: '#eef4ea',
    destructive: '#e35a62',
    border: 'rgba(255, 255, 255, 0.1)',
    input: 'rgba(255, 255, 255, 0.15)',
    ring: '#75b65c',
    chart1: '#75b65c',
    chart2: '#a9f4ef',
    chart3: '#f79b2d',
    chart4: '#e35a62',
    chart5: '#f8d544',
  },
} as const;

export type ColorScheme = keyof typeof SemanticColors;

export const Colors = SemanticColors;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export function getThemeVariables(scheme: ColorScheme): Record<string, string> {
  return Object.fromEntries(
    Object.entries(SemanticColors[scheme]).map(([key, value]) => [
      `--color-${key.replace(/([A-Z]|\d+)/g, '-$1').toLowerCase()}`,
      value,
    ])
  );
}

export const Fonts = {
  sans: 'SourceSans3_400Regular',
  sansMedium: 'SourceSans3_500Medium',
  sansSemibold: 'SourceSans3_600SemiBold',
  sansBold: 'SourceSans3_700Bold',
  heading: 'BeVietnamPro_600SemiBold',
  headingMedium: 'BeVietnamPro_500Medium',
  headingBold: 'BeVietnamPro_700Bold',
  headingExtraBold: 'BeVietnamPro_800ExtraBold',
  display: 'Figtree_400Regular',
  mono: 'GeistMono_400Regular',
} as const;

export const Radius = {
  sm: 6,
  md: 8,
  lg: 10,
  xl: 14,
  '2xl': 18,
  '3xl': 22,
  '4xl': 26,
} as const;

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;
