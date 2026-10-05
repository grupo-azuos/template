import { ChevronLeft, ChevronRight } from 'lucide-react';

import { cn } from '../../utils/cn.util';

/**
 * A BARRA DE PÁGINA de uma lista longa.
 *
 * Ela diz TRÊS coisas, e as três importam:
 *
 *  1. **Quantos itens existem ao todo** — "26–50 de 312". Sem isso a lista é cortada em silêncio, e
 *     quem lê não sabe que há mais.
 *  2. **Onde a pessoa está** — página 2 de 13.
 *  3. **Como andar** — anterior e próxima, DESLIGADAS nas pontas em vez de escondidas: um botão que
 *     some faz a barra pular de lugar a cada clique.
 *
 * Não tem lista de números de página, de propósito: com trezentas páginas ela viraria uma régua, e a
 * pergunta que se faz numa lista ordenada por data é "mais um pouco para trás", não "me leve à
 * página 47".
 */
export type AzuosPaginationBarProps = {
  data: {
    page: number;
    pageSize: number;
    /** Quantos itens existem ao todo, e não quantos vieram nesta página. */
    total: number;
    /** O que está sendo contado, no singular e no plural: "tarefa" / "tarefas". */
    noun: [singular: string, plural: string];
    /**
     * O gênero do substantivo, para a lista vazia concordar: "Nenhuma tarefa", e não "Nenhum
     * tarefa". Não há como deduzir do final da palavra — "dia" e "problema" terminam em "a" e são
     * masculinos —, então quem usa o componente informa. O padrão é o masculino.
     */
    gender?: 'masculine' | 'feminine';
  };
  state?: { isLoading?: boolean };
  ui?: { className?: string };
  actions: { onPageChange: (page: number) => void };
};

/** Quantas páginas existem. Zero item ainda é UMA página — a que diz que não há nada. */
export function pageCountOf(total: number, pageSize: number): number {
  if (pageSize <= 0) return 1;

  return Math.max(1, Math.ceil(total / pageSize));
}

/**
 * "26–50 de 312 tarefas" — a faixa desta página dentro do total.
 *
 * Exportada para ter teste próprio: é a frase que impede a lista de mentir por omissão, e errar a
 * conta aqui é dizer à pessoa que ela já viu tudo quando não viu.
 */
export function rangeLabelOf(data: AzuosPaginationBarProps['data']): string {
  const [singular, plural] = data.noun;
  if (data.total === 0) {
    return (data.gender === 'feminine' ? 'Nenhuma ' : 'Nenhum ') + singular;
  }

  const first = (data.page - 1) * data.pageSize + 1;
  const last = Math.min(data.total, data.page * data.pageSize);
  const noun = data.total === 1 ? singular : plural;

  /* Uma página só: dizer "1–7 de 7" é ruído — o total já responde tudo. */
  if (data.total <= data.pageSize) return data.total + ' ' + noun;

  return first + '–' + last + ' de ' + data.total + ' ' + noun;
}

const STEP_CLASS =
  'border-border/70 bg-card hover:bg-muted/50 text-foreground rounded-control control-sm inline-flex cursor-pointer items-center gap-1 border font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50';

export function AzuosPaginationBar({ data, state, ui, actions }: AzuosPaginationBarProps) {
  const pageCount = pageCountOf(data.total, data.pageSize);
  const isFirst = data.page <= 1;
  const isLast = data.page >= pageCount;

  return (
    /* Empilha no celular: os três blocos lado a lado a 360px espremem o texto do meio. */
    <div
      className={cn(
        'text-muted-foreground flex flex-col items-center justify-between gap-2 pt-3 text-xs sm:flex-row',
        ui?.className,
      )}
    >
      <span>{rangeLabelOf(data)}</span>

      {pageCount > 1 ? (
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={isFirst || state?.isLoading}
            onClick={() => actions.onPageChange(data.page - 1)}
            className={STEP_CLASS}
          >
            <ChevronLeft className="size-3.5" aria-hidden="true" />
            Anterior
          </button>

          <span className="tabular-nums">
            Página {data.page} de {pageCount}
          </span>

          <button
            type="button"
            disabled={isLast || state?.isLoading}
            onClick={() => actions.onPageChange(data.page + 1)}
            className={STEP_CLASS}
          >
            Próxima
            <ChevronRight className="size-3.5" aria-hidden="true" />
          </button>
        </div>
      ) : null}
    </div>
  );
}
