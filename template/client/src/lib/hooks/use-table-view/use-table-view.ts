import { useSyncExternalStore } from 'react';

import { createPreferenceStore } from '../../utils/preference-store.util';

/**
 * "Ver sempre em cartões" — uma preferência do SISTEMA, não de uma tela: quem prefere cartões liga
 * uma vez e toda lista do painel passa a abrir assim, em qualquer largura.
 *
 * Sem preferência salva, a tela decide pela própria largura (cartões no celular, tabela no
 * monitor) — "automático" continua sendo o padrão de quem nunca tocou no botão.
 */

export type TableView = 'auto' | 'cards';

const STORAGE_KEY = 'azuos-table-view';

const store = createPreferenceStore<TableView>({
  key: STORAGE_KEY,
  fallback: () => 'auto',
  parse: (raw) => (raw === 'cards' ? 'cards' : raw === 'auto' ? 'auto' : null),
});

export type TableViewModel = {
  view: TableView;
  /** O que cada tela pergunta: "devo forçar cartões, mesmo tendo espaço para a tabela?" */
  forceCards: boolean;
  actions: { onToggle: () => void };
};

export function useTableView(): TableViewModel {
  const view = useSyncExternalStore(store.subscribe, store.read, () => 'auto' as const);

  return {
    view,
    forceCards: view === 'cards',
    actions: {
      onToggle: () => store.write(view === 'cards' ? 'auto' : 'cards'),
    },
  };
}
