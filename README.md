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
- `src/constants/theme.ts` holds the same brand palette and light/dark semantic colors for React Native APIs that require JavaScript color values, such as navigation.
- `assets/branding/` contains the Vedora logos and illustrations from `vedora-frontend/public`, plus app icon derivatives. The root screen and auth forms use these assets; Expo starter tabs and sample UI have been removed.
- `src/components/vedora-theme-provider.tsx` supplies semantic CSS variables to NativeWind based on the system color scheme. It is mounted in `src/app/_layout.tsx`.
- `metro.config.js` keeps semantic color variables dynamic; `postcss.config.mjs` compiles Tailwind.
- When a web color changes, update the matching value in both `src/global.css` and `src/constants/theme.ts` using `vedora-frontend/app/globals.css` as the source of truth.

Use semantic utilities for surfaces and text:

```tsx
import { Text, View } from "react-native";

<View className="rounded-lg border border-border bg-card p-4">
  <Text className="font-heading text-lg text-card-foreground">Vedora</Text>
  <Text className="font-sans text-muted-foreground">Ăn sạch, Sống xanh</Text>
</View>;
```

Use `BrandColors`, `SemanticColors`, `Radius`, and `Spacing` from `src/constants/theme.ts` when a native prop or `StyleSheet` cannot use a Tailwind class. The matching Tailwind colors include `bg-primary`, `text-foreground`, and `bg-brand-forest`.

Fonts match the frontend: Source Sans 3 for body text, Be Vietnam Pro for headings, Figtree for Latin display text, and Geist Mono for code. The root layout loads only the font weights listed in `src/global.css`. For a bold heading use `font-heading-bold`; React Native does not automatically select the correct font file from `font-bold`.

NativeWind v5 is currently a release candidate. Its `nativewind` and `react-native-css` versions are pinned together for Expo SDK 57. After changing its config, restart Metro with `npx expo start --clear`. Native dependency changes also require a new development build.

## API and state

Copy `.env.example` to `.env.local`, then set `EXPO_PUBLIC_API_URL` to the API address reachable from your device. The default is `http://localhost:4000/api/v1`, matching `vedora-frontend`; Android emulators use `http://10.0.2.2:4000/api/v1`. `EXPO_PUBLIC_*` values are bundled into the app, so do not put secrets in them.

- `src/shared/api/api-client.ts`: Axios instance with base URL, Bearer token and normalized `ApiError` responses. A 401 on an authenticated request refreshes once, then replays the request; concurrent 401s share one rotation.
- `src/shared/api/request-json.ts`: parses response data with a Zod schema before it reaches UI or the Query cache.
- `src/shared/query/`: one TanStack Query provider per app root; native foreground and network events drive refetching. Changing the session token clears cached responses.
- `src/shared/stores/session-store.ts`: in-memory session for UI and API requests. On Android/iOS, `src/shared/session/` stores only the refresh token in Expo SecureStore and rotates it when the app starts, on 401, or when the app returns to the foreground near token expiry. Web sessions remain in memory.
- `src/features/auth/`: login, registration, email verification, resend code and sign-out. Routes live at `/login`, `/register` and `/verify-email`; the home screen links to them. The API must be reachable through `EXPO_PUBLIC_API_URL` on the device.
- `src/features/app-info/`: small reference module showing `types` (Zod), `data` (query key), `services` (Axios) and `hooks` (TanStack Query) for the existing `GET /api/v1` endpoint.

See `docs/AGENT_RULES.md` for the required module layout and dependency direction when adding features.
