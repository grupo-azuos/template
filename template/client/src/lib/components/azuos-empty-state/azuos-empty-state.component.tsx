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
        'flex flex-col items-center justify-center gap-2 rounded-box border border-dashed border-ink-300 px-6 py-12 text-center',
        ui?.className,
      )}
    >
      <span className="flex size-11 items-center justify-center rounded-full bg-ink-100 text-ink-500">
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <p className="text-sm font-semibold text-ink-900">{data.title}</p>
      {data.description ? (
        <p className="max-w-sm text-sm text-ink-500">{data.description}</p>
      ) : null}
      {children ? <div className="mt-2">{children}</div> : null}
    </div>
  );
}
