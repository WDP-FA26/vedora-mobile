import { VariableContextProvider } from 'nativewind';
import type { PropsWithChildren } from 'react';

import { getThemeVariables } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export function VedoraThemeProvider({ children }: PropsWithChildren) {
  const colorScheme = useColorScheme();
  const scheme = colorScheme === 'dark' ? 'dark' : 'light';

  return (
    <VariableContextProvider value={getThemeVariables(scheme)}>
      {children}
    </VariableContextProvider>
  );
}
