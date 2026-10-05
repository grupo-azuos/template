import { Inbox, type LucideIcon } from 'lucide-react';
import { type ReactNode } from 'react';

import { cn } from '../../utils/cn.util';

/**
 * A lista vazia, com o que fazer a respeito.
 *
 * Vazio não é erro, e a tela não pode parecer quebrada: borda tracejada (não cheia), ícone neutro
 * e, quando faz sentido, o botão que resolve. Tela que some sem explicação é como alguém conclui
 * que o sistema perdeu os dados.
 */
export type AzuosEmptyStateProps = {
  data: { title: string; description?: string };
  ui?: { icon?: LucideIcon; className?: string };
  /** A ação sugerida, já montada (normalmente um `AzuosActionButton`). */
  children?: ReactNode;
};

export function AzuosEmptyState({ data, ui, children }: AzuosEmptyStateProps) {
  const Icon = ui?.icon ?? Inbox;

  return (
    <div
      className={cn(
        'border-ink-300 rounded-box flex flex-col items-center justify-center gap-2 border border-dashed px-6 py-12 text-center',
        ui?.className,
      )}
    >
      <span className="bg-ink-100 text-ink-500 flex size-11 items-center justify-center rounded-full">
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <p className="text-ink-900 text-sm font-semibold">{data.title}</p>
      {data.description ? (
        <p className="text-ink-500 max-w-sm text-sm">{data.description}</p>
      ) : null}
      {children ? <div className="mt-2">{children}</div> : null}
    </div>
  );
}
