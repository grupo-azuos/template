import { Lock, type LucideIcon } from 'lucide-react';
import { type ReactNode } from 'react';

import { cn } from '../../utils/cn.util';

/**
 * Um bloco de formulário com título — e com o motivo, escrito, quando ele está travado.
 *
 * O travado não some: painel que desaparece faz a pessoa achar que a função não existe. No
 * sistema anterior o comentário escrito num alvará ainda sem registro era descartado em
 * silêncio, e o chamado chegou como "não consigo salvar nada nesse cadastro".
 */
export type AzuosFormSectionProps = {
  data: { title: string; description?: string };
  ui?: { icon?: LucideIcon; className?: string };
  state?: { lockedMessage?: string | null };
  children?: ReactNode;
};

export function AzuosFormSection({ data, ui, state, children }: AzuosFormSectionProps) {
  const Icon = ui?.icon;

  return (
    <section aria-label={data.title} className={cn('space-y-2', ui?.className)}>
      <header className="space-y-0.5">
        <h3 className="flex items-center gap-1.5 text-xs font-semibold text-ink-700 uppercase">
          {Icon ? <Icon size={14} aria-hidden="true" /> : null}
          {data.title}
        </h3>
        {data.description ? <p className="text-xs text-ink-500">{data.description}</p> : null}
      </header>

      {state?.lockedMessage ? (
        <p className="flex items-center gap-2 rounded-control border border-dashed border-ink-300 bg-muted px-3 py-2 text-xs text-ink-500">
          <Lock size={12} aria-hidden="true" className="shrink-0" />
          {state.lockedMessage}
        </p>
      ) : (
        children
      )}
    </section>
  );
}
