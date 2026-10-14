# Vedora Mobile

Expo Router app using the visual system from `vedora-frontend`.

## Start

```bash
npm install
npx expo start --clear
```

Run `npx tsc --noEmit` and `npx expo lint` before merging changes.

## Styling and tokens

- `src/global.css` is the Tailwind CSS v4 / NativeWind v5 theme. There is no `tailwind.config.js` in this CSS-first setup.
- `src/constants/theme.ts` holds the same brand palette and light/dark semantic colors for React Native APIs that require JavaScript color values, such as navigation and native tabs.
- `src/components/vedora-theme-provider.tsx` supplies semantic CSS variables to NativeWind based on the system color scheme. It is mounted in `src/app/_layout.tsx`.
- `metro.config.js` keeps semantic color variables dynamic; `postcss.config.mjs` compiles Tailwind.
- When a web color changes, update the matching value in both `src/global.css` and `src/constants/theme.ts` using `vedora-frontend/app/globals.css` as the source of truth.

Use semantic utilities for surfaces and text:

```tsx
import { Text, View } from 'react-native';

<View className="rounded-lg border border-border bg-card p-4">
  <Text className="font-heading text-lg text-card-foreground">Vedora</Text>
  <Text className="font-sans text-muted-foreground">Sống xanh có ý thức</Text>
</View>;
```

Use `BrandColors`, `SemanticColors`, `Radius`, and `Spacing` from `src/constants/theme.ts` when a native prop or `StyleSheet` cannot use a Tailwind class. The matching Tailwind colors include `bg-primary`, `text-foreground`, and `bg-brand-forest`.

Fonts match the frontend: Source Sans 3 for body text, Be Vietnam Pro for headings, Figtree for Latin display text, and Geist Mono for code. The root layout loads only the font weights listed in `src/global.css`. For a bold heading use `font-heading-bold`; React Native does not automatically select the correct font file from `font-bold`.

NativeWind v5 is currently a release candidate. Its `nativewind` and `react-native-css` versions are pinned together for Expo SDK 57. After changing its config, restart Metro with `npx expo start --clear`. Native dependency changes also require a new development build.
