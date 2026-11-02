import { Children, type ReactNode } from 'react';

import { cn } from '../../utils/cn.util';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '../ui/carousel';

/**
 * Uma faixa que desliza para o lado — arrastando com o mouse ou o dedo, ou pelas setas nas pontas.
 *
 * Existe para a fileira que não cabe numa linha: com doze cartões, a grade virava três linhas e
 * empurrava a lista (que é o que a pessoa veio ver) para baixo da dobra. Na faixa, o que sobra fica
 * a um arraste de distância, e a altura é sempre a de UM cartão.
 *
 * As setas saem da posição do shadcn (penduradas FORA da caixa, a 48px) e entram na própria linha:
 * penduradas, elas caíam em cima do menu lateral. A altura é a da régua, e o rótulo, em português.
 */
export type AzuosCarouselProps = {
  ui: {
    /** O nome da faixa para o leitor de tela ("Resumo por status"). */
    ariaLabel: string;
    /** Quanto cada item ocupa da faixa — `basis-1/2 lg:basis-1/4`, por exemplo. */
    itemClassName?: string;
    className?: string;
  };
  children?: ReactNode;
};

const ARROW_CLASS =
  'rounded-control static size-(--control-sm) shrink-0 translate-x-0 translate-y-0';

export function AzuosCarousel({ ui, children }: AzuosCarouselProps) {
  return (
    <Carousel
      aria-label={ui.ariaLabel}
      /* `dragFree`: solto, a faixa corre um pouco e para onde parou, como uma lista de celular —
         preso cartão a cartão, arrastar doze virava uma sequência de trancos. */
      opts={{ align: 'start', dragFree: true }}
      className={cn('flex items-center gap-2', ui.className)}
    >
      <CarouselPrevious className={ARROW_CLASS} aria-label="Ver anteriores" />
      {/* A faixa corta tudo o que sai dela — e o anel do cartão escolhido, o "levantar" e a sombra
          flutuante do hover (`shadow-xl`, ~40px para baixo) saem. A folga de dentro dá espaço a
          eles; a margem negativa de fora devolve quase toda essa altura, para a faixa não empurrar
          a tela. Essa margem invade o vizinho de baixo, por isso a área vazia não recebe clique
          (`pointer-events-none`) — só os itens recebem, e o arraste continua, porque o evento
          deles sobe até a faixa. */}
      <div className="pointer-events-none -mt-4 -mb-9 min-w-0 flex-1">
        {/* A folga da DIREITA mora no último item (`last:pr-3`), e não no fim da faixa: o Embla
            para de rolar onde o último item termina e ignora o espaço depois dele — com a folga
            na faixa, a borda e o anel do último cartão ficavam cortados. */}
        <CarouselContent className="-ml-3 pt-6 pb-11 pl-3">
          {Children.toArray(children).map((child, index) => (
            <CarouselItem
              key={index}
              className={cn('pointer-events-auto pl-3 last:pr-3', ui.itemClassName)}
            >
              {child}
            </CarouselItem>
          ))}
        </CarouselContent>
      </div>
      <CarouselNext className={ARROW_CLASS} aria-label="Ver próximos" />
    </Carousel>
  );
}
