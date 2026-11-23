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
 *
 * `data.badge` é um selo curto ao lado do título ("2 ativos"), para o bloco fechado ainda dizer
 * que há algo dentro. `aside` é uma ação na ponta direita do cabeçalho ("Limpar filtros"): fica
 * FORA do botão que abre e fecha (botão dentro de botão não existe), e com ela a seta vai para
 * junto do título — a ponta direita é da ação.
 */
export type AzuosCollapsibleProps = {
  data: { title: string; badge?: string };
  ui?: { className?: string };
  state?: { isOpen?: boolean; isDisabled?: boolean };
  actions?: { onOpenChange?: (isOpen: boolean) => void };
  aside?: ReactNode;
  children?: ReactNode;
};

export function AzuosCollapsible({
  data,
  ui,
  state,
  actions,
  aside,
  children,
}: AzuosCollapsibleProps) {
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
      className={cn('rounded-box bg-card shadow-card', ui?.className)}
    >
      <div className="flex items-center gap-2">
        <CollapsibleTrigger
          className={cn(
            'text-foreground rounded-box hover:bg-hover-veil flex w-full min-w-0 flex-1 items-center gap-3 px-4 py-3 text-left text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60',
            aside ? 'justify-start' : 'justify-between',
          )}
        >
          <span className="flex min-w-0 flex-wrap items-center gap-2">
            <span className="break-words">{data.title}</span>
            {data.badge ? (
              <span className="rounded-chip bg-primary-soft text-primary px-2 py-0.5 text-xs font-semibold tabular-nums">
                {data.badge}
              </span>
            ) : null}
          </span>
          <ChevronDown
            className={cn(
              'text-muted-foreground size-4 shrink-0 transition-transform duration-300 ease-out',
              isOpen && 'rotate-180',
            )}
            aria-hidden="true"
          />
        </CollapsibleTrigger>
        {aside ? <div className="flex shrink-0 items-center pr-3">{aside}</div> : null}
      </div>

      {/* ABRIR E FECHAR ANIMADOS: a caixa desliza na altura do conteúdo (a altura vem do Radix,
          `--radix-collapsible-content-height`) e o texto entra subindo e aparecendo. O respiro
          mora no filho, porque padding na caixa que anima a altura dá um tranco no fim. Quem
          pediu menos movimento vê abrir na hora (`motion-safe`). */}
      <CollapsibleContent className="data-[state=open]:motion-safe:animate-collapsible-down data-[state=closed]:motion-safe:animate-collapsible-up overflow-hidden">
        <div className="border-border text-foreground/85 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-top-1 border-t px-4 py-3 text-sm motion-safe:duration-300">
          {children}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
