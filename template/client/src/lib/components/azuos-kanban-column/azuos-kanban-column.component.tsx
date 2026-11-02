import { Plus } from 'lucide-react';
import { type ReactNode, useState } from 'react';

import { cardToneClasses } from '../../utils/card-tone.util';
import { cn } from '../../utils/cn.util';
import { readDragItem } from '../../utils/drag-item.util';

/**
 * UMA COLUNA DE QUADRO (kanban): título com contagem, os cartões e o "Adicionar" no fim.
 *
 * Genérica: não sabe se o cartão é tarefa ou projeto. Recebe os cartões prontos em `children`
 * e avisa `onDropItem` com o identificador do cartão solto nela (ver `drag-item.util.ts`) —
 * quem decide o que "mover para esta coluna" significa é a tela.
 *
 * O destaque enquanto um cartão passa por cima é estado PURAMENTE visual, e por isso mora
 * aqui num `useState`.
 */
export type AzuosKanbanColumnTone = 'neutral' | 'info' | 'warning' | 'brand' | 'success' | 'danger';

export type AzuosKanbanColumnProps = {
  data: { title: string; count: number };
  ui?: { tone?: AzuosKanbanColumnTone; addLabel?: string; className?: string };
  actions?: { onDropItem?: (id: number) => void; onAdd?: () => void };
  children?: ReactNode;
};

/** A faixa colorida do cabeçalho — a cor da etapa, como nos selos de situação. */
const TONE_HEADER: Record<AzuosKanbanColumnTone, string> = {
  neutral: cardToneClasses('neutral').chip,
  info: cardToneClasses('info').chip,
  warning: cardToneClasses('warning').chip,
  brand: cardToneClasses('brand').chip,
  success: cardToneClasses('success').chip,
  danger: cardToneClasses('danger').chip,
};

export function AzuosKanbanColumn({ data, ui, actions, children }: AzuosKanbanColumnProps) {
  const [isOver, setIsOver] = useState(false);
  const canDrop = Boolean(actions?.onDropItem);

  return (
    <section
      aria-label={data.title}
      className={cn(
        'bg-mantle rounded-surface flex w-72 shrink-0 flex-col sm:w-80',
        isOver && 'bg-accent',
        ui?.className,
      )}
      onDragOver={(event) => {
        if (!canDrop) return;
        event.preventDefault();
        setIsOver(true);
      }}
      onDragLeave={() => setIsOver(false)}
      onDrop={(event) => {
        event.preventDefault();
        setIsOver(false);
        const id = readDragItem(event);
        if (id !== null) actions?.onDropItem?.(id);
      }}
    >
      <header
        className={cn(
          'rounded-t-surface flex items-center justify-between gap-2 px-4 py-2.5 text-sm font-semibold',
          TONE_HEADER[ui?.tone ?? 'neutral'],
        )}
      >
        <h2 className="truncate">{data.title}</h2>
        <span className="tabular-nums" aria-label={`${data.count} itens`}>
          {data.count}
        </span>
      </header>

      <div className="flex min-h-48 flex-col gap-2 p-3">
        {children}
        {actions?.onAdd ? (
          <button
            type="button"
            onClick={actions.onAdd}
            className="border-input text-ink-500 hover:bg-accent hover:text-foreground rounded-control control-md flex items-center justify-center gap-1.5 border-2 border-dashed text-sm font-medium transition-colors"
          >
            <Plus aria-hidden="true" className="size-4" />
            {ui?.addLabel ?? 'Adicionar'}
          </button>
        ) : null}
      </div>
    </section>
  );
}
