import { type LucideIcon } from 'lucide-react';
import { type ReactNode } from 'react';

import { type AzuosCardTone } from '../../utils/card-tone.util';
import { cn } from '../../utils/cn.util';
import { AzuosCardSurface } from '../azuos-card-surface/azuos-card-surface.component';

/**
 * O CARD DE CONTEÚDO: uma empresa, uma auditoria, qualquer coisa com título e detalhes.
 *
 * Superfície da marca (`AzuosCardSurface`) com o ícone do assunto grande no canto, no sotaque dele
 * (como no hero card) — é por ali que a cor escolhida pela pessoa aparece sem pintar o card. O
 * conteúdo é livre (`children`). O hover é o véu da superfície; no tom com `ui.isHoverColored`.
 */
export type AzuosContentCardProps = {
  data?: { label?: string };
  ui?: {
    tone?: AzuosCardTone;
    icon?: LucideIcon;
    isHoverColored?: boolean;
    className?: string;
  };
  state?: { isSelected?: boolean };
  actions?: { onClick?: () => void };
  children: ReactNode;
};

export function AzuosContentCard({ data, ui, state, actions, children }: AzuosContentCardProps) {
  return (
    <AzuosCardSurface
      data={data}
      ui={{
        className: cn('flex flex-col gap-2 p-4', ui?.className),
        mark: ui?.icon,
        markTone: ui?.tone,
        isHoverColored: ui?.isHoverColored,
        hoverTone: ui?.tone,
      }}
      state={state}
      actions={actions}
    >
      {children}
    </AzuosCardSurface>
  );
}
