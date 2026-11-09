import { Loader2 } from 'lucide-react';

import { cn } from '../../utils/cn.util';

/**
 * "Carregando…" com o que está carregando.
 *
 * O texto diz O QUÊ, e não só que há espera: numa tela com lista e painel lado a lado, um
 * girador sem legenda deixa a pessoa sem saber se é a lista que falhou ou se ainda vem.
 */
export type AzuosLoadingStateProps = {
  data: { label: string };
  ui?: { className?: string };
};

export function AzuosLoadingState({ data, ui }: AzuosLoadingStateProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'flex items-center justify-center gap-2 py-10 text-sm text-ink-500',
        ui?.className,
      )}
    >
      <Loader2 className="size-4 animate-spin" aria-hidden />
      {data.label}
    </div>
  );
}
