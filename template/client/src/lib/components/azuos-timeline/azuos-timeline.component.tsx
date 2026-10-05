import { type ReactNode } from 'react';

import { cn } from '../../utils/cn.util';

/**
 * Casca de uma lista de etapas (usar com `AzuosTimelineStep`).
 *
 * Troca "um monte de campo solto" por uma NARRATIVA: cada etapa aparece na ordem em que acontece,
 * com um ícone e uma linha ligando à próxima — como o histórico de um atendimento, não como um
 * formulário de cadastro.
 */
export type AzuosTimelineProps = {
  ui?: { className?: string };
  children: ReactNode;
};

export function AzuosTimeline({ ui, children }: AzuosTimelineProps) {
  return <div className={cn('flex flex-col', ui?.className)}>{children}</div>;
}
