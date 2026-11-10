const { getDefaultConfig } = require('expo/metro-config');
const { withNativewind } = require('nativewind/metro');

const path = require('node:path');

const config = getDefaultConfig(__dirname);

const nativewindConfig = withNativewind(config, {
  inlineVariables: {
    exclude: [
      '--color-background',
      '--color-foreground',
      '--color-card',
      '--color-card-foreground',
      '--color-popover',
      '--color-popover-foreground',
      '--color-primary',
      '--color-primary-foreground',
      '--color-secondary',
      '--color-secondary-foreground',
      '--color-muted',
      '--color-muted-foreground',
      '--color-accent',
      '--color-accent-foreground',
      '--color-destructive',
      '--color-border',
      '--color-input',
      '--color-ring',
      '--color-chart-1',
      '--color-chart-2',
      '--color-chart-3',
      '--color-chart-4',
      '--color-chart-5',
    ],
  },
});

// NativeWind redirects every `react-native` import to its styled wrapper. expo-asset (it loads the app's fonts)
// reads `AssetRegistry` from `react-native`, which the wrapper does not expose on iOS, so useFonts failed with
// "Cannot read property 'getAssetByID' of undefined" and every custom font fell back to the system font.
// expo-asset therefore resolves `react-native` directly.
const nativewindResolve = nativewindConfig.resolver.resolveRequest;
nativewindConfig.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'react-native' && context.originModulePath.includes(`${path.sep}expo-asset${path.sep}`)) {
    return context.resolveRequest(context, moduleName, platform);
  }
  return nativewindResolve ? nativewindResolve(context, moduleName, platform) : context.resolveRequest(context, moduleName, platform);
};

module.exports = nativewindConfig;
