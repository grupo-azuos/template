import {
  type QueryClient,
  useMutation,
  useQueries,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { useEffect, useState } from 'react';

import {
  type Board,
  type BoardFilter,
  boardFilterApplies,
  BOARD_FILTER_CARD_SOURCES,
  boardFilterDisplay,
  type BoardFilterDisplay,
  type BoardFilterKind,
  BOARD_FILTER_KIND_LABELS,
  type BoardFilterPlace,
  type BoardFilterValues,
  type BoardFilterWidth,
  boardMatches,
  boardWeight,
  COMPACT_WIDGET_KINDS,
  DASHBOARD_SCOPE_LABELS,
  DATA_SOURCE_KEYS,
  dimensionsOf,
  EMPTY_BOARD_FILTER_VALUES,
  type DashboardScope,
  GRID_COLUMNS,
  type LayoutItem,
  MAX_BOARD_WEIGHT,
  type Widget,
  type WidgetData,
  type WidgetKind,
  type WidgetQuery,
  widgetQueryOf,
} from '@template/shared/schemas/dashboard-board.schema';
import { hasRoleAtLeast } from '@template/shared/schemas/user.schema';

import { dashboardBoardsApi } from '../api/dashboard-boards.api';
import { ApiError, readError } from '../api/http-client';
import { mockAuth } from '../auth/mock-user';
import { readBoardFiltersOpen, writeBoardFiltersOpen } from '../utils/board-filters-open.util';
import { type BoardItem, boardLinkOf } from '../utils/board-link.util';
import { type PersonOption, usePeopleModel } from './use-people.model';

/**
 * O DASHBOARD MONTADO — Equipe, Gestor e Pessoal, cada um um canvas de até 10 blocos. Zero JSX.
 *
 * Ver: os números de cada bloco vêm do servidor e se renovam sozinhos a cada 5 minutos (e no
 * botão "Atualizar"). Editar: a pessoa arrasta, redimensiona, troca o gráfico e a fonte num
 * RASCUNHO, e só o "Salvar" grava — desistir no meio não deixa painel pela metade.
 */
export type WidgetState = { data: WidgetData | null; isLoading: boolean; error: string | null };

export type DashboardBoardModel = {
  data: {
    scope: DashboardScope;
    scopes: { value: DashboardScope; label: string }[];
    widgets: Widget[];
    layout: LayoutItem[];
    results: Record<string, WidgetState>;
    /**
     * O bloco aberto no editor: um que existe, ou um novo (`isNew`). O novo que foi SOLTO numa
     * casa da grade traz o lugar (`place`); sem ele, entra embaixo de tudo.
     */
    editing: { widget: Widget; isNew: boolean; place?: Omit<LayoutItem, 'i'> } | null;
    /** Os números do bloco como está no editor AGORA — a pré-visualização ao vivo. */
    preview: WidgetState | null;
    updatedAt: string | null;
    /** Os filtros do painel (Pessoa, Período) e o que quem vê escolheu em cada um. */
    boardFilters: BoardFilter[];
    filterValues: BoardFilterValues;
    /** Os números dos filtros em "Cards", pelo id do filtro: quantos há em cada opção. */
    filterCounts: Record<string, FilterCounts>;
    /** Quem o filtro "Responsável" oferece — as pessoas com acesso ao sistema; o filtro guarda o id. */
    people: PersonOption[];
    /** Os pontos que o painel já gasta, da cota de `MAX_BOARD_WEIGHT`. */
    weight: number;
    /** De quanto em quanto o painel se renova sozinho (uma das `REFRESH_OPTIONS`). */
    refreshEvery: string;
  };
  state: {
    isLoading: boolean;
    isEditing: boolean;
    isSaving: boolean;
    isRefreshing: boolean;
    canEdit: boolean;
    canAdd: boolean;
    error: string | null;
    /** A faixa de filtros do painel aberta — escolha de quem vê, lembrada por painel. */
    isFiltersOpen: boolean;
  };
  actions: {
    onScopeChange: (scope: string) => void;
    onRefresh: () => void;
    onStartEdit: () => void;
    onCancelEdit: () => void;
    onSave: () => void;
    onLayoutChange: (layout: LayoutItem[]) => void;
    /**
     * Um bloco novo, já no tipo escolhido na lateral de montar (colunas, se nenhum) — e no lugar
     * da grade onde ele foi solto, quando veio arrastado.
     */
    onNewWidget: (kind?: WidgetKind, place?: Omit<LayoutItem, 'i'>) => void;
    onEditWidget: (id: string) => void;
    onCloseEditor: () => void;
    onSubmitWidget: (widget: Widget) => void;
    onRemoveWidget: (id: string) => void;
    /** O "Duplicar" do menu do bloco: uma cópia no fim do painel. */
    onDuplicateWidget: (id: string) => void;
    /** Quem vê escolheu de quanto em quanto o painel se renova. */
    onRefreshEveryChange: (value: string) => void;
    /** O editor avisa a cada mudança, e a pré-visualização busca os números dela. */
    onPreviewChange: (widget: Widget) => void;
    /** Quem vê escolheu um valor num filtro do painel — todos os blocos releem. */
    onFilterValueChange: (patch: Partial<BoardFilterValues>) => void;
    /** "Limpar filtros": todos os filtros do painel voltam a "todos". */
    onClearFilterValues: () => void;
    /** A seta dos "Filtros": abriu ou fechou a faixa — fica lembrado para este painel. */
    onFiltersOpenChange: (isOpen: boolean) => void;
    /** Montando: põe um filtro no painel (um de cada tipo) ou tira. */
    onAddBoardFilter: (kind: BoardFilterKind) => void;
    onRemoveBoardFilter: (id: string) => void;
    /** Montando: o desenho do filtro na barra (lista suspensa, busca, cards). */
    onBoardFilterDisplayChange: (id: string, display: BoardFilterDisplay) => void;
    /** Montando: o filtro numa peça ou na linha inteira da barra. */
    onBoardFilterWidthChange: (id: string, width: BoardFilterWidth) => void;
    /** Montando: a ordem nova dos filtros na barra. */
    onBoardFilterPlaceChange: (places: readonly BoardFilterPlaceChange[]) => void;
    /**
     * Clicou num item de um bloco (barra, fatia, linha, card): abre a lista da fonte com o
     * recorte do bloco e o valor clicado.
     */
    onOpenItem: (widget: Widget, item: BoardItem) => void;
  };
};

/** De quanto em quanto os números se renovam sozinhos. */
export const REFRESH_MS = 5 * 60 * 1000;

/**
 * O "ATUALIZAR A CADA" do Grafana: quem vê escolhe de quanto em quanto o painel se renova sozinho
 * — ou desliga. O valor é de quem vê, e não se grava no painel.
 */
export const REFRESH_OPTIONS = [
  { value: 'off', label: 'Desligado' },
  { value: '60000', label: '1 minuto' },
  { value: String(REFRESH_MS), label: '5 minutos' },
  { value: '900000', label: '15 minutos' },
] as const;

/** O intervalo em milissegundos de uma opção — `false` desliga a renovação sozinha. */
export function refreshIntervalOf(value: string): number | false {
  const ms = Number(value);

  return Number.isFinite(ms) && ms > 0 ? ms : false;
}

type Draft = { widgets: Widget[]; layout: LayoutItem[]; filters: BoardFilter[] };

export function useDashboardBoardModel(): DashboardBoardModel {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isManager = hasRoleAtLeast(mockAuth.getUser().role, 'manager');
  const scopes = visibleScopes(isManager);
  const [scope, setScope] = useState<DashboardScope>('team');
  const [draft, setDraft] = useState<Draft | null>(null);
  const [editing, setEditing] = useState<DashboardBoardModel['data']['editing']>(null);
  const [chosen, setChosen] = useState<BoardFilterValues>(EMPTY_BOARD_FILTER_VALUES);
  const [refreshEvery, setRefreshEvery] = useState<string>(String(REFRESH_MS));
  const [filtersOpen, setFiltersOpen] = useState<Partial<Record<DashboardScope, boolean>>>({});
  const refetchInterval = refreshIntervalOf(refreshEvery);
  const people = usePeopleModel();

  const board = useQuery({
    queryKey: ['dashboard-board', scope],
    queryFn: () => dashboardBoardsApi.board(scope).then(({ data }) => data.board),
  });
  const saved = savedFacts(board.data);
  const shown: Draft = draft ?? saved.content;
  /* Valor de um filtro que o painel não tem mais não vale: tirar o filtro solta o recorte. */
  const filterValues = activeValues(shown.filters, chosen);
  const results = useWidgetResults(shown.widgets, filterValues, refetchInterval);
  const preview = useWidgetPreview(editing, filterValues);
  const filterCounts = useFilterCounts(shown.filters, filterValues, refetchInterval);
  useDashboardStream(queryClient);

  const save = useMutation({
    mutationFn: (content: Draft) => dashboardBoardsApi.saveBoard(scope, content),
    onSuccess: ({ data }) => {
      queryClient.setQueryData<Board>(['dashboard-board', scope], data.board);
      setDraft(null);
    },
  });

  const edit = (change: (current: Draft) => Draft) =>
    setDraft((current) => change(current ?? shown));

  return {
    data: {
      scope,
      scopes,
      widgets: shown.widgets,
      layout: shown.layout,
      results,
      editing,
      preview: preview.result,
      updatedAt: saved.updatedAt,
      boardFilters: shown.filters,
      filterValues,
      filterCounts,
      people: people.people,
      weight: boardWeight(shown.widgets),
      refreshEvery,
    },
    state: {
      isLoading: board.isLoading,
      isEditing: draft !== null,
      isSaving: save.isPending,
      isRefreshing: board.isFetching || isAnyLoading(results),
      canEdit: saved.canEdit,
      // Cabe mais um bloco enquanto sobra ao menos 1 ponto (o peso do mais leve) na cota.
      canAdd: boardWeight(shown.widgets) < MAX_BOARD_WEIGHT,
      error: readError(board.error) ?? saveErrorOf(save.error, shown.widgets, shown.layout),
      isFiltersOpen: filtersOpen[scope] ?? readBoardFiltersOpen(scope),
    },
    actions: {
      onScopeChange: (next) => {
        if (!scopes.some((option) => option.value === next)) return;
        setDraft(null);
        setEditing(null);
        setScope(next as DashboardScope);
      },
      onRefresh: () => void queryClient.invalidateQueries({ queryKey: ['dashboard-board'] }),
      onStartEdit: () => setDraft(shown),
      onCancelEdit: () => {
        setDraft(null);
        setEditing(null);
        save.reset();
      },
      onSave: () => {
        if (draft) save.mutate(draft);
      },
      onLayoutChange: (layout) =>
        edit((current) => ({
          ...current,
          layout: normalizeLayout(layout, compactIdsOf(current.widgets)),
        })),
      onNewWidget: (kind, place) => setEditing({ widget: newWidget(kind), isNew: true, place }),
      onEditWidget: (id) => {
        const widget = shown.widgets.find((item) => item.id === id);
        if (widget) setEditing({ widget, isNew: false });
      },
      onCloseEditor: () => setEditing(null),
      onSubmitWidget: (widget) => {
        edit((current) => upsertWidget(current, widget, editing?.place));
        setEditing(null);
      },
      onRemoveWidget: (id) =>
        edit((current) => ({
          ...current,
          widgets: current.widgets.filter((widget) => widget.id !== id),
          layout: current.layout.filter((item) => item.i !== id),
        })),
      onDuplicateWidget: (id) => {
        if (boardWeight(shown.widgets) >= MAX_BOARD_WEIGHT) return;
        edit((current) => duplicateWidget(current, id, newWidgetId()));
      },
      onRefreshEveryChange: setRefreshEvery,
      onPreviewChange: preview.onChange,
      onFilterValueChange: (patch) => setChosen((current) => ({ ...current, ...patch })),
      onClearFilterValues: () => setChosen(EMPTY_BOARD_FILTER_VALUES),
      onFiltersOpenChange: (isOpen) => {
        writeBoardFiltersOpen(scope, isOpen);
        setFiltersOpen((current) => ({ ...current, [scope]: isOpen }));
      },
      onAddBoardFilter: (kind) => edit((current) => addBoardFilter(current, kind)),
      onRemoveBoardFilter: (id) =>
        edit((current) => ({
          ...current,
          filters: current.filters.filter((filter) => filter.id !== id),
        })),
      onBoardFilterDisplayChange: (id, display) =>
        edit((current) => setBoardFilterDisplay(current, id, display)),
      onBoardFilterWidthChange: (id, width) =>
        edit((current) => setBoardFilterWidth(current, id, width)),
      onBoardFilterPlaceChange: (places) =>
        edit((current) => setBoardFilterPlaces(current, places)),
      onOpenItem: (widget, item) => {
        const link = boardLinkOf(widget, filterValues, item);
        /* A tela vem do arquivo das fontes do projeto (um texto), e o roteador não a confere aqui:
           toda tela de destino aceita o recorte (`drillSearchSchema`). */
        if (link) void navigate(link as never);
      },
    },
  };
}

/** Um filtro de cada tipo: pedir um que o painel já tem não muda nada. */
export function addBoardFilter(current: Draft, kind: BoardFilterKind): Draft {
  if (current.filters.some((filter) => filter.kind === kind)) return current;
  const filter = { id: kind, kind, label: BOARD_FILTER_KIND_LABELS[kind] };

  return { ...current, filters: [...current.filters, filter] };
}

/** Troca o desenho de um filtro; o resto do painel fica como está. */
export function setBoardFilterDisplay(
  current: Draft,
  id: string,
  display: BoardFilterDisplay,
): Draft {
  return {
    ...current,
    filters: current.filters.map((filter) => (filter.id === id ? { ...filter, display } : filter)),
  };
}

/** A largura nova do filtro na barra — normal ou a linha inteira. */
export function setBoardFilterWidth(current: Draft, id: string, width: BoardFilterWidth): Draft {
  return {
    ...current,
    filters: current.filters.map((filter) => (filter.id === id ? { ...filter, width } : filter)),
  };
}

export type BoardFilterPlaceChange = { id: string; place: BoardFilterPlace };

/**
 * O lugar novo de cada filtro — a ordem da barra. Só muda o lugar: o resto do filtro (nome,
 * desenho) fica como estava, e um id que o painel não tem é ignorado.
 */
export function setBoardFilterPlaces(
  current: Draft,
  places: readonly BoardFilterPlaceChange[],
): Draft {
  const byId = new Map(places.map((change) => [change.id, change.place]));

  return {
    ...current,
    filters: current.filters.map((filter) => {
      const place = byId.get(filter.id);

      return place ? { ...filter, place } : filter;
    }),
  };
}

/** Só valem os valores dos filtros que o painel tem. */
export function activeValues(
  filters: readonly BoardFilter[],
  chosen: BoardFilterValues,
): BoardFilterValues {
  const kept = { ...EMPTY_BOARD_FILTER_VALUES };
  for (const { kind } of filters) Object.assign(kept, { [kind]: chosen[kind] });

  return kept;
}

/**
 * A PRÉ-VISUALIZAÇÃO DO EDITOR: o bloco como o editor diz que ele está, com os números de
 * verdade. A pergunta vai pelo mesmo cache dos blocos — voltar a uma combinação já vista é
 * instantâneo. Abrir outro bloco recomeça pelo que ele é.
 */
function useWidgetPreview(
  editing: DashboardBoardModel['data']['editing'],
  values: BoardFilterValues,
) {
  const [changed, setChanged] = useState<Widget | null>(null);
  const widget =
    changed && editing && changed.id === editing.widget.id ? changed : (editing?.widget ?? null);
  const results = useWidgetResults(widget ? [widget] : [], values);

  return { result: widget ? (results[widget.id] ?? null) : null, onChange: setChanged };
}

export type FilterCounts = {
  total: number;
  series: { key: string; label: string; value: number }[];
  isLoading: boolean;
};

/**
 * A CONTA DE CADA CARD de um filtro em "Cards": a mesma pergunta de um bloco — a fonte agrupada
 * pelo campo do filtro —, recortada pelos OUTROS filtros do painel. O próprio filtro fica de fora
 * da conta: com "Concluída" escolhido, os outros cards continuam mostrando quantos há neles, e não
 * zero.
 */
export function filterCountQuery(
  filter: Pick<BoardFilter, 'kind'>,
  values: BoardFilterValues,
): WidgetQuery | null {
  const card = BOARD_FILTER_CARD_SOURCES[filter.kind];
  if (!card) return null;
  const others = { ...values, [filter.kind]: null };

  return {
    source: card.source,
    groupBy: card.groupBy,
    splitBy: null,
    filterId: null,
    onlyMine: false,
    period: 'all',
    window: null,
    person: boardFilterApplies('person', card.source) ? others.person : null,
    boardPeriod: values.period,
    matches: boardMatches(others, card.source),
  };
}

function useFilterCounts(
  filters: readonly BoardFilter[],
  values: BoardFilterValues,
  refetchInterval: number | false,
): Record<string, FilterCounts> {
  const asked = filters.flatMap((filter) => {
    if (boardFilterDisplay(filter) !== 'cards') return [];
    const query = filterCountQuery(filter, values);

    return query ? [{ id: filter.id, query }] : [];
  });
  const queries = useQueries({
    queries: asked.map(({ query }) => ({
      queryKey: ['dashboard-board', 'data', query],
      queryFn: () => dashboardBoardsApi.data(query).then(({ data }) => data.result),
      refetchInterval,
    })),
  });

  return Object.fromEntries(
    asked.map(({ id }, index) => {
      const result = queries[index];

      return [
        id,
        {
          total: result?.data?.total ?? 0,
          series: result?.data?.series ?? [],
          isLoading: result?.isFetching ?? false,
        },
      ];
    }),
  );
}

/** Os números de cada bloco — uma consulta por bloco, em cache pela pergunta, não pelo bloco. */
function useWidgetResults(
  widgets: Widget[],
  values: BoardFilterValues,
  refetchInterval: number | false = REFRESH_MS,
): Record<string, WidgetState> {
  const queries = useQueries({
    queries: widgets.map((widget) => {
      const query = widgetQueryOf(widget, values);

      return {
        queryKey: ['dashboard-board', 'data', query],
        queryFn: () => dashboardBoardsApi.data(query).then(({ data }) => data.result),
        refetchInterval,
      };
    }),
  });

  return Object.fromEntries(
    widgets.map((widget, index) => {
      const query = queries[index];

      return [
        widget.id,
        {
          data: query?.data ?? null,
          isLoading: query?.isFetching ?? false,
          error: readError(query?.error),
        },
      ];
    }),
  );
}

/** O que o painel gravado diz — ou o vazio, enquanto ele não chega. */
function savedFacts(board: Board | undefined): {
  content: Draft;
  updatedAt: string | null;
  canEdit: boolean;
} {
  if (!board) {
    return { content: { widgets: [], layout: [], filters: [] }, updatedAt: null, canEdit: false };
  }

  return {
    content: { widgets: board.widgets, layout: board.layout, filters: board.filters },
    updatedAt: board.updatedAt,
    canEdit: board.canEdit,
  };
}

function isAnyLoading(results: Record<string, WidgetState>): boolean {
  return Object.values(results).some((result) => result.isLoading);
}

export function visibleScopes(isManager: boolean): { value: DashboardScope; label: string }[] {
  const scopes: DashboardScope[] = isManager
    ? ['team', 'manager', 'personal']
    : ['team', 'personal'];

  return scopes.map((value) => ({ value, label: DASHBOARD_SCOPE_LABELS[value] }));
}

/**
 * O bloco novo, na primeira fonte do sistema e agrupado pela primeira categoria dela — no
 * destaque, os maiores grupos viram os cards ao lado do Zuzu. O editor acerta o resto quando o
 * tipo pede outro (no tempo, ou em par).
 */
function newWidget(kind: WidgetKind = 'column'): Widget {
  const source = DATA_SOURCE_KEYS[0]!;
  const category = Object.entries(dimensionsOf(source)).find(
    ([, dimension]) => dimension.kind === 'category',
  );

  return {
    id: newWidgetId(),
    kind,
    title: '',
    source,
    groupBy: category?.[0] ?? null,
    splitBy: null,
    filterId: null,
    onlyMine: false,
    period: 'all',
    window: null,
  };
}

/** Um id novo de bloco — do bloco novo e da cópia do "Duplicar". */
export function newWidgetId(): string {
  return `w${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

/**
 * Uma CÓPIA do bloco, no mesmo tamanho, no fim do painel — o "Duplicar" do menu do bloco. O título
 * ganha "(cópia)", para as duas não se confundirem.
 */
export function duplicateWidget(current: Draft, id: string, copyId: string): Draft {
  const widget = current.widgets.find((item) => item.id === id);
  if (!widget) return current;
  const size = current.layout.find((item) => item.i === id) ?? { w: 2, h: 2 };
  const bottom = Math.max(0, ...current.layout.map((item) => item.y + item.h));
  const copy = { ...widget, id: copyId, title: `${widget.title} (cópia)`.slice(0, 60) };

  return upsertWidget(current, copy, { x: 0, y: bottom, w: size.w, h: size.h });
}

/**
 * O TEMPO REAL: o servidor avisa quando algo foi gravado (toda escrita entra no histórico), e os
 * blocos se releem. O `EventSource` reconecta sozinho; os 5 minutos continuam como rede de segurança.
 */
function useDashboardStream(queryClient: QueryClient): void {
  useEffect(() => {
    if (typeof EventSource === 'undefined') return;
    const source = new EventSource(dashboardBoardsApi.streamUrl(), { withCredentials: true });
    source.addEventListener('dashboard', () => {
      void queryClient.invalidateQueries({ queryKey: ['dashboard-board', 'data'] });
    });

    return () => source.close();
  }, [queryClient]);
}

/** Bloco novo entra embaixo de tudo, com 2×2; o que já existe só troca o conteúdo. */
export function upsertWidget(current: Draft, widget: Widget, place?: Omit<LayoutItem, 'i'>): Draft {
  if (current.widgets.some((item) => item.id === widget.id)) {
    return {
      ...current,
      widgets: current.widgets.map((item) => (item.id === widget.id ? widget : item)),
    };
  }
  const bottom = Math.max(0, ...current.layout.map((item) => item.y + item.h));
  const spot = place ?? { x: 0, y: bottom, w: 2, h: 2 };
  const widgets = [...current.widgets, widget];

  return {
    ...current,
    widgets,
    layout: normalizeLayout([...current.layout, { i: widget.id, ...spot }], compactIdsOf(widgets)),
  };
}

/** Os tipos que cabem numa casa só (1×1) vêm do contrato: a tela e o servidor contam igual. */
export function compactIdsOf(widgets: readonly Widget[]): ReadonlySet<string> {
  return new Set(
    widgets
      .filter((widget) => COMPACT_WIDGET_KINDS.includes(widget.kind))
      .map((widget) => widget.id),
  );
}

/**
 * A recusa do "Guardar", dita pelo NOME do bloco. O servidor aponta o problema por posição
 * (`layout.9`, `widgets.2.groupBy`), que não diz nada a quem monta o painel; aqui cada um vira
 * `"Tarefas": o motivo`. O rascunho continua aberto, para a pessoa consertar e guardar de novo.
 */
export function saveErrorOf(
  error: unknown,
  widgets: readonly Widget[],
  layout: readonly LayoutItem[],
): string | null {
  if (!error) return null;
  const details = error instanceof ApiError ? error.details : [];
  if (details.length === 0) return `Não guardei o painel: ${readError(error)}`;

  const titleAt = (path: string): string | null => {
    const [list, index] = path.split('.');
    const position = Number(index);
    if (list === 'widgets') return widgets[position]?.title ?? null;
    if (list !== 'layout') return null;
    const id = layout[position]?.i;
    return widgets.find((widget) => widget.id === id)?.title ?? null;
  };
  const reasons = details.map((detail) => {
    const title = titleAt(detail.field);
    return title ? `"${title}": ${detail.message}` : detail.message;
  });

  return `Não guardei o painel. ${[...new Set(reasons)].join('. ')}.`;
}

/**
 * Nenhum bloco passa da borda das 4 colunas, e nenhum fica 1×1 — gráfico numa casa só vira
 * borrão. A exceção são os de `compactIds` (o card com anel), que são um card e cabem nela.
 */
export function normalizeLayout(
  layout: readonly LayoutItem[],
  compactIds: ReadonlySet<string> = new Set(),
): LayoutItem[] {
  return layout.map((item) => {
    const w = Math.min(Math.max(item.w, 1), GRID_COLUMNS);
    const x = Math.min(item.x, GRID_COLUMNS - w);
    const isTooSmall = w < 2 && item.h < 2 && !compactIds.has(item.i);

    return { i: item.i, x, y: item.y, w, h: isTooSmall ? 2 : item.h };
  });
}
