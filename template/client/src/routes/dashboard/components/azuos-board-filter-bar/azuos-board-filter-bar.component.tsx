import { Plus } from 'lucide-react';

import {
  BOARD_FILTER_KIND_LABELS,
  BOARD_FILTER_KINDS,
  type BoardFilter,
  type BoardFilterDisplay,
  type BoardFilterKind,
  type BoardFilterPlace,
  type BoardFilterValues,
  type BoardFilterWidth,
  placedBoardFilters,
} from '@template/shared/schemas/dashboard-board.schema';

import { AzuosActionButton } from '../../../../lib/components/azuos-action-button/azuos-action-button.component';
import { AzuosCardSurface } from '../../../../lib/components/azuos-card-surface/azuos-card-surface.component';
import { AzuosClearFiltersButton } from '../../../../lib/components/azuos-clear-filters-button/azuos-clear-filters-button.component';
import { AzuosCollapsible } from '../../../../lib/components/azuos-collapsible/azuos-collapsible.component';
import { cn } from '../../../../lib/utils/cn.util';
import {
  type BoardFilterPlaceChange,
  type FilterCounts,
} from '../../../../lib/view-models/use-dashboard-board.model';
import { type PersonOption } from '../../../../lib/view-models/use-people.model';
import { BoardFilterControl } from './board-filter-control';
import { BoardFilterListEditor } from './board-filter-list-editor';
import { activeSummary, readingOrder, toolbarDisplayOf } from './board-filter.util';

/**
 * OS FILTROS DO PAINEL, no estilo do Grafana — uma BARRA compacta acima dos blocos, que recorta
 * TODOS de uma vez, na ordem que quem montou escolheu. Cada filtro é uma peça só ("Status da
 * tarefa | Todos ▾"), num cartão, em grade que se ajusta à largura. O Período é o seletor de tempo,
 * no canto de cima do painel (`ui.part`).
 *
 * O valor escolhido é de quem está vendo, e não se grava. A faixa abre e fecha pela seta dos
 * "Filtros", no cabeçalho do cartão, com o "Limpar filtros" na outra ponta; nasce aberta.
 *
 * Montando, a barra aparece como fica e, embaixo, a lista dos filtros (como as variáveis do
 * Grafana): arrastar para ordenar, escolher o desenho e a largura, tirar; e os que faltam, para
 * pôr.
 */
export type AzuosBoardFilterBarProps = {
  data: {
    filters: BoardFilter[];
    values: BoardFilterValues;
    /** Quem o filtro "Responsável" oferece — com foto; o filtro guarda o id. */
    people: PersonOption[];
    /** Os números dos filtros em "Cards", pelo id do filtro: quantos há em cada opção. */
    counts?: Record<string, FilterCounts>;
    /** Os filtros que dá para pôr. Sem a lista, todos. */
    kinds?: readonly BoardFilterKind[];
  };
  /**
   * `part`: qual pedaço da barra desenhar. `period` é o seletor de tempo do Grafana, no canto de
   * cima do painel; `fields` são os outros filtros, na faixa acima dos blocos. Sem ele, todos.
   */
  ui?: { part?: 'fields' | 'period' };
  /**
   * `isListOpen`: montando, a lista dos filtros já nasce aberta (nas configurações do painel).
   * `isOpen`: a faixa dos filtros nasce aberta (o padrão) ou fechada — a escolha lembrada.
   */
  state?: { isEditing?: boolean; isListOpen?: boolean; isOpen?: boolean };
  actions: {
    onChange: (patch: Partial<BoardFilterValues>) => void;
    /** "Limpar filtros": todos voltam a "todos". Sem ela, o botão não aparece. */
    onClear?: () => void;
    /** A seta dos "Filtros" abriu ou fechou a faixa — para a tela lembrar. */
    onOpenChange?: (isOpen: boolean) => void;
    onAdd?: (kind: BoardFilterKind) => void;
    onRemove?: (id: string) => void;
    /** Montando: troca o desenho do filtro. */
    onDisplayChange?: (id: string, display: BoardFilterDisplay) => void;
    /** Montando: o filtro numa peça ou na linha inteira. */
    onWidthChange?: (id: string, width: BoardFilterWidth) => void;
    /** Montando: a ordem nova dos filtros na barra. */
    onPlaceChange?: (places: readonly BoardFilterPlaceChange[]) => void;
  };
};

type PlacedFilter = BoardFilter & { place: BoardFilterPlace };

export function AzuosBoardFilterBar({ data, ui, state, actions }: AzuosBoardFilterBarProps) {
  const ordered = orderedFilters(data.filters, ui?.part);
  if (state?.isEditing) {
    return <FilterSettings data={{ ...data, ordered }} state={state} actions={actions} />;
  }
  if (ordered.length === 0) return null;
  if (ui?.part === 'period') {
    /* O SELETOR DE TEMPO, no canto de cima, ao lado do "Atualizar" — sem cartão: é um controle
       da barra de cima, como no Grafana. Em "Datas exatas", as datas entram ao lado dele, na
       mesma fileira (a peça cresce para caber as duas). */
    const isExactDates = data.values.period?.mode === 'custom';

    return (
      <div role="group" aria-label="Período do painel" className="flex flex-wrap items-start gap-2">
        {ordered.map((filter) => (
          <div key={filter.id} className={cn('max-w-full min-w-0', !isExactDates && 'w-72')}>
            <Control data={data} filter={filter} actions={actions} />
          </div>
        ))}
      </div>
    );
  }

  return (
    <section aria-label="Filtros do painel">
      <Toolbar
        data={{ ...data, ordered }}
        state={{ isEditing: false, isOpen: state?.isOpen }}
        actions={actions}
      />
    </section>
  );
}

/** Os filtros na ordem da barra, só os do pedaço pedido. */
function orderedFilters(
  filters: readonly BoardFilter[],
  part: 'fields' | 'period' | undefined,
): PlacedFilter[] {
  return readingOrder(placedBoardFilters(filters)).filter((filter) => {
    if (part === 'period') return filter.kind === 'period';
    if (part === 'fields') return filter.kind !== 'period';

    return true;
  });
}

/**
 * O cartão que junta os filtros numa faixa só. No alto, o cabeçalho: "Filtros" com a seta, que
 * abre e fecha a faixa, e o selo de quantos estão ligados — fechada, a pessoa ainda sabe que o
 * painel está recortado; na outra ponta, o "Limpar filtros". Ele mora no cabeçalho, e não na
 * grade: como célula, empurrava as peças e quebrava a faixa dos cards.
 *
 * Dentro, uma GRADE que se ajusta à largura: cada peça tem no mínimo 18rem e as colunas se dividem
 * por igual — no celular, uma por linha; numa tela larga, todas lado a lado, sem sobra torta no
 * fim. A ordem é a da lista de quem montou.
 */
function Toolbar({
  data,
  state,
  actions,
}: {
  data: AzuosBoardFilterBarProps['data'] & { ordered: PlacedFilter[] };
  state: { isEditing: boolean; isOpen?: boolean };
  actions: AzuosBoardFilterBarProps['actions'];
}) {
  const active = activeSummary(data);
  const canClear = Boolean(actions.onClear) && !state.isEditing && active.length > 0;

  return (
    <AzuosCardSurface>
      {/* O bloco que abre e fecha é transparente: o cartão é a superfície (card dentro de card não). */}
      <AzuosCollapsible
        data={{ title: 'Filtros', badge: activeBadge(active.length) }}
        ui={{ className: 'rounded-none bg-transparent shadow-none' }}
        state={{ isOpen: state.isOpen ?? true }}
        actions={{ onOpenChange: actions.onOpenChange }}
        /* Sempre no cabeçalho (some sozinho sem filtro ligado): a seta fica junto do título, e não
           pula de ponta quando o "Limpar" aparece. */
        aside={
          <AzuosClearFiltersButton
            state={{ hasFilter: canClear }}
            actions={{ onClear: () => actions.onClear?.() }}
          />
        }
      >
        <div className="grid min-w-0 grid-cols-[repeat(auto-fill,minmax(min(100%,18rem),1fr))] gap-2">
          {data.ordered.map((filter) => (
            /* "Linha inteira" (e os cards, que são uma faixa): a peça ocupa a linha toda, sozinha. */
            <div
              key={filter.id}
              className={cn(
                'min-w-0',
                (filter.width === 'full' || toolbarDisplayOf(filter) === 'cards') &&
                  'col-span-full',
              )}
            >
              <Control data={data} filter={filter} actions={actions} />
            </div>
          ))}
        </div>
      </AzuosCollapsible>
    </AzuosCardSurface>
  );
}

/** O selo do cabeçalho: quantos filtros estão ligados; sem nenhum, selo nenhum. */
export function activeBadge(count: number): string | undefined {
  if (count === 0) return undefined;

  return count === 1 ? '1 ativo' : `${count} ativos`;
}

function Control({
  data,
  filter,
  actions,
}: {
  data: AzuosBoardFilterBarProps['data'];
  filter: BoardFilter;
  actions: AzuosBoardFilterBarProps['actions'];
}) {
  return (
    <BoardFilterControl
      data={{
        filter,
        display: toolbarDisplayOf(filter),
        values: data.values,
        people: data.people,
        counts: data.counts?.[filter.id] ?? null,
      }}
      actions={{ onChange: actions.onChange }}
    />
  );
}

/**
 * MONTANDO: a barra como quem vê vai encontrá-la e, embaixo, a lista para ajustar — a ordem, o
 * desenho, a largura —, com os filtros que faltam para pôr.
 */
function FilterSettings({
  data,
  state,
  actions,
}: {
  data: AzuosBoardFilterBarProps['data'] & { ordered: PlacedFilter[] };
  state: NonNullable<AzuosBoardFilterBarProps['state']>;
  actions: AzuosBoardFilterBarProps['actions'];
}) {
  const missing = (data.kinds ?? BOARD_FILTER_KINDS).filter(
    (kind) => !data.filters.some((filter) => filter.kind === kind),
  );
  const canAdd = Boolean(actions.onAdd) && missing.length > 0;

  return (
    <section aria-label="Filtros do painel" className="flex flex-col gap-4">
      {data.ordered.length > 0 ? (
        <div className="flex flex-col gap-2">
          <span className="text-muted-foreground text-sm font-medium">Como a barra aparece</span>
          <Toolbar data={data} state={{ isEditing: true }} actions={actions} />
        </div>
      ) : null}
      {data.ordered.length > 0 || canAdd ? (
        <AzuosCollapsible
          data={{ title: `Ajustar os filtros (${data.ordered.length})` }}
          state={{ isOpen: state.isListOpen }}
        >
          <div className="flex flex-col gap-3">
            {data.ordered.length > 0 ? (
              <BoardFilterListEditor data={{ filters: data.ordered }} actions={actions} />
            ) : null}
            {canAdd ? (
              <div className="flex flex-wrap items-center gap-2">
                {missing.map((kind) => (
                  <AzuosActionButton
                    key={kind}
                    data={{ label: BOARD_FILTER_KIND_LABELS[kind] }}
                    ui={{ variant: 'secondary', icon: Plus }}
                    actions={{ onClick: () => actions.onAdd?.(kind) }}
                  />
                ))}
              </div>
            ) : null}
          </div>
        </AzuosCollapsible>
      ) : null}
      {data.filters.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          Ponha um filtro para quem vê recortar todos os blocos de uma vez.
        </p>
      ) : null}
    </section>
  );
}
