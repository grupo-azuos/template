import { X } from 'lucide-react';

import { AzuosActionButton } from '../azuos-action-button/azuos-action-button.component';

export type AzuosClearFiltersButtonProps = {
  ui?: { className?: string };
  state: { hasFilter: boolean };
  actions: { onClear: () => void };
};

/**
 * "LIMPAR FILTROS" — o mesmo botão em toda tela que filtra.
 *
 * Só aparece quando há algum filtro ligado: sem filtro não há o que limpar, e um botão que não
 * faz nada é ruído na barra. Limpar devolve a tela ao padrão dela, que é o que a pessoa vê ao
 * abrir a tela pela primeira vez.
 */
export function AzuosClearFiltersButton({ ui, state, actions }: AzuosClearFiltersButtonProps) {
  if (!state.hasFilter) return null;

  return (
    <AzuosActionButton
      data={{ label: 'Limpar filtros' }}
      ui={{ variant: 'ghost', size: 'sm', icon: X, className: ui?.className }}
      actions={{ onClick: actions.onClear }}
    />
  );
}
