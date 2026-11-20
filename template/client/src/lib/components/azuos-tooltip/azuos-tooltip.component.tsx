import { type ReactElement, type ReactNode } from 'react';

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';

/**
 * A DICA que aparece ao passar o mouse (ou ao focar com o teclado) sobre um elemento.
 *
 * Existe para o texto que a tela CORTA: um título de duas linhas numa lista, o nome comprido de uma
 * empresa. O texto inteiro continua a um passar de mouse, sem a lista ter de crescer. Também serve
 * para explicar um número ("o que conta neste cartão") sem ocupar espaço na tela.
 *
 * Quem a usa passa o elemento que dispara (`children`) — ele recebe a dica no lugar, sem `div` a
 * mais em volta, e por isso precisa aceitar `ref` (um elemento HTML, ou um componente que repasse o
 * `ref`). Sem conteúdo, ou desligada, devolve o elemento puro: dica vazia é uma bolha preta de
 * quem passou o mouse à toa.
 *
 * O componente baixado (\`ui/tooltip\`) fica original; o atraso curto e o texto escuro sobre o
 * claro (e o inverso) vêm dele, e acompanham o tema.
 */
export type AzuosTooltipProps = {
  data: { content: ReactNode };
  /** `align`: onde o balão encosta no gatilho — `start` deixa o texto cortado começar alinhado. */
  ui?: {
    side?: 'top' | 'right' | 'bottom' | 'left';
    align?: 'start' | 'center' | 'end';
    className?: string;
  };
  /**
   * `isOpen`: a dica aberta POR COMANDO, e não pelo mouse — para quando a tela precisa apontar
   * para um elemento (o "Li e entendi" de quem tentou sair sem confirmar). Sem ele, o de sempre.
   */
  state?: { isDisabled?: boolean; isOpen?: boolean };
  /** O elemento que dispara a dica. */
  children: ReactElement;
};

/** Espera um instante antes de abrir: sem isso, a dica pisca em todo elemento que o mouse cruza. */
const OPEN_DELAY_MS = 300;

export function AzuosTooltip({ data, ui, state, children }: AzuosTooltipProps) {
  if (state?.isDisabled || !data.content) return children;

  return (
    <TooltipProvider delayDuration={OPEN_DELAY_MS}>
      <Tooltip open={state?.isOpen}>
        <TooltipTrigger asChild>{children}</TooltipTrigger>
        <TooltipContent {...placementOf(ui)}>{data.content}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/** Onde o balão abre e a largura dele, com os padrões de sempre. */
function placementOf(ui: AzuosTooltipProps['ui']) {
  return {
    side: ui?.side ?? 'top',
    align: ui?.align ?? 'center',
    className: ui?.className ?? 'max-w-xs break-words',
  };
}
