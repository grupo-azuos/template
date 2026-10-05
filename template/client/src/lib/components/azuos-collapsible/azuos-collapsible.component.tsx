import { ChevronDown } from 'lucide-react';
import { useState, type ReactNode } from 'react';

import { cn } from '../../utils/cn.util';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/collapsible';

/**
 * Um bloco que abre e fecha: o título fica sempre à vista, o conteúdo aparece quando a pessoa pede.
 * Envolve o `ui/collapsible` do shadcn.
 *
 * Serve para o que é DETALHE — filtros avançados, explicação longa —, nunca para esconder o que a
 * pessoa precisa ver para decidir. Informação escondida atrás de um clique é informação que metade
 * das pessoas não vai ler.
 *
 * `state.isOpen` é só como o bloco NASCE. Depois quem manda é o clique; a tela é avisada por
 * `actions.onOpenChange` se quiser lembrar a escolha.
 */
export type AzuosCollapsibleProps = {
  data: { title: string };
  ui?: { className?: string };
  state?: { isOpen?: boolean; isDisabled?: boolean };
  actions?: { onOpenChange?: (isOpen: boolean) => void };
  children?: ReactNode;
};

export function AzuosCollapsible({ data, ui, state, actions, children }: AzuosCollapsibleProps) {
  /* `useState` puramente visual: aberto ou fechado. O valor de `state.isOpen` entra só como estado
     INICIAL — depois do primeiro clique, quem manda é o componente, e não a prop. */
  const [isOpen, setIsOpen] = useState(state?.isOpen ?? false);

  const handleOpenChange = (next: boolean) => {
    setIsOpen(next);
    actions?.onOpenChange?.(next);
  };

  return (
    <Collapsible
      open={isOpen}
      disabled={state?.isDisabled}
      onOpenChange={handleOpenChange}
      className={cn('border-border bg-card rounded-box border', ui?.className)}
    >
      <CollapsibleTrigger className="text-ink-900 flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm font-medium disabled:cursor-not-allowed disabled:opacity-60">
        <span className="break-words">{data.title}</span>
        <ChevronDown
          className={cn(
            'text-ink-500 size-4 shrink-0 transition-transform',
            isOpen && 'rotate-180',
          )}
          aria-hidden="true"
        />
      </CollapsibleTrigger>

      <CollapsibleContent className="border-border/60 text-ink-700 border-t px-4 py-3 text-sm">
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
}
