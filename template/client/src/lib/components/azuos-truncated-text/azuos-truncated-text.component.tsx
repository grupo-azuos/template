import { type ReactNode, useRef, useState } from 'react';

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { cn } from '../../utils/cn.util';

/**
 * UM TEXTO QUE PODE NÃO CABER NA COLUNA: cortado com "…", e o texto inteiro num balão ao passar o
 * mouse.
 *
 * O balão só abre quando o corte aconteceu de verdade — "Aguardando" inteiro na tela não precisa
 * repetir "Aguardando" em cima. Quem corta é a classe passada em `ui.className` (`truncate`,
 * `line-clamp-2`) ou o filho (o selo do status corta a si mesmo): os dois são medidos.
 */
export type AzuosTruncatedTextProps = {
  data: { text: string };
  ui?: { className?: string };
  /** O que aparece na célula. Sem filho, é o próprio texto. */
  children?: ReactNode;
};

/** Cortou se o conteúdo é maior que a caixa — na largura (`truncate`) ou na altura (`line-clamp`). */
function isClipped(element: Element | null) {
  if (!element) return false;
  return element.scrollWidth > element.clientWidth || element.scrollHeight > element.clientHeight;
}

export function AzuosTruncatedText({ data, ui, children }: AzuosTruncatedTextProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const [isOpen, setIsOpen] = useState(false);

  const changeOpen = (next: boolean) => {
    const element = ref.current;
    setIsOpen(next && (isClipped(element) || isClipped(element?.firstElementChild ?? null)));
  };

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip open={isOpen} onOpenChange={changeOpen}>
        <TooltipTrigger asChild>
          <span ref={ref} className={cn('block min-w-0', ui?.className)}>
            {children ?? data.text}
          </span>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">{data.text}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
