import { type ReactNode } from 'react';

import { cn } from '../../utils/cn.util';

/**
 * O título da tela e as ações dela, numa fileira só.
 *
 * O `<h1>` é de verdade: é por ele que um leitor de tela sabe em que tela a pessoa está, e é o
 * primeiro ponto de parada ao navegar por cabeçalhos.
 */
export type AzuosPageHeaderProps = {
  data: { title: string; description?: string };
  ui?: { className?: string };
  /** As ações da tela, já montadas (normalmente `AzuosActionButton`). Ficam à direita. */
  children?: ReactNode;
};

export function AzuosPageHeader({ data, ui, children }: AzuosPageHeaderProps) {
  return (
    <header
      className={cn(
        'flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between',
        ui?.className,
      )}
    >
      <div className="min-w-0">
        <h1 className="text-ink-900 text-xl font-bold">{data.title}</h1>
        {data.description ? (
          <p className="text-ink-500 mt-0.5 text-sm">{data.description}</p>
        ) : null}
      </div>

      {children ? (
        /* `items-center`: sem ele os itens da fileira esticam (é o padrão do flex), e um grupo de
           botões pequenos ao lado de um botão maior encosta no topo em vez de ficar na mesma linha
           do meio. Com o `flex-wrap`, o mesmo vale para a segunda linha quando a tela é estreita. */
        <div className="flex shrink-0 flex-wrap items-center gap-2">{children}</div>
      ) : null}
    </header>
  );
}
