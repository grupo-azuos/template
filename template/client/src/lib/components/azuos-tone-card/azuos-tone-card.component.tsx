import { type ReactNode } from 'react';

import { type AzuosCardTone } from '../../utils/card-tone.util';
import { AzuosCardSurface } from '../azuos-card-surface/azuos-card-surface.component';

/**
 * O card de uso geral com tom, sobre a `AzuosCardSurface`: superfície da marca, hover com a mancha
 * do GSAP (no tom quando `mode="interactive"`) e escolhido no azul claro da marca. Mantido para as
 * telas que já o usam; card novo usa um dos quatro formatos (`AzuosStatCard`,
 * `AzuosMiniStatCard`, `AzuosContentCard`, `AzuosDashboardHeroCard`).
 */
export type AzuosToneCardTone = AzuosCardTone;

export type AzuosToneCardProps = {
  data?: { label?: string };
  ui?: {
    tone?: AzuosToneCardTone;
    mode?: 'static' | 'interactive';
    className?: string;
  };
  state?: { isSelected?: boolean };
  actions?: { onClick?: () => void };
  children: ReactNode;
};

export function AzuosToneCard({ data, ui, state, actions, children }: AzuosToneCardProps) {
  return (
    <AzuosCardSurface
      data={data}
      ui={{
        className: ['p-4', ui?.className].filter(Boolean).join(' '),
        isHoverColored: ui?.mode === 'interactive',
        hoverTone: ui?.tone,
      }}
      state={state}
      actions={actions}
    >
      {children}
    </AzuosCardSurface>
  );
}
