import { useSyncExternalStore } from 'react';

import { createThemeStore, type Theme } from './theme-cookie.util';

export type { Theme } from './theme-cookie.util';

const store = createThemeStore();

/** A mesma preferência em todas as telas e em todos os subdomínios do grupo. */
export function useTheme(): { theme: Theme; actions: { onToggle: () => void } } {
  const theme = useSyncExternalStore(store.subscribe, store.read, () => 'light' as const);
  return {
    theme,
    actions: { onToggle: () => store.write(store.read() === 'dark' ? 'light' : 'dark') },
  };
}
