import { useSyncExternalStore } from 'react';

import { createPreferenceStore } from '../utils/preference-store.util';

/**
 * O TEMA CLARO/ESCURO da tela: um atributo `data-theme` no `<html>`, guardado no navegador para
 * sobreviver ao fechar a aba.
 *
 * Mora aqui e não em `lib/hooks/` de propósito: não é o estado de UMA tela, é uma preferência do
 * sistema inteiro — e é a mesma identidade visual que `lib/theme/tokens.css` descreve.
 *
 * Nada salvo ainda? Segue a preferência do SISTEMA OPERACIONAL, não um padrão fixo. Quem já
 * deixou o computador no escuro não quer abrir uma tela branca de manhã.
 */

export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'azuos-theme';

function systemPrefersDark(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;

  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

const store = createPreferenceStore<Theme>({
  key: STORAGE_KEY,
  fallback: () => (systemPrefersDark() ? 'dark' : 'light'),
  parse: (raw) => (raw === 'light' || raw === 'dark' ? raw : null),
  apply: (theme) => {
    if (typeof document === 'undefined') return;

    document.documentElement.setAttribute('data-theme', theme);
  },
});

export function useTheme(): { theme: Theme; actions: { onToggle: () => void } } {
  const theme = useSyncExternalStore(store.subscribe, store.read, () => 'light' as const);

  return {
    theme,
    actions: {
      onToggle: () => store.write(theme === 'dark' ? 'light' : 'dark'),
    },
  };
}
