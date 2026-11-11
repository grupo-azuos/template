import {
  type QueryClient,
  useMutation,
  useQueries,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { useEffect, useState } from 'react';

import {
  type Board,
  type BoardFilter,
  boardFilterApplies,
  type BoardFilterKind,
  BOARD_FILTER_KIND_LABELS,
  type BoardFilterValues,
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
} from '@template/shared/schemas/dashboard-board.schema';
import { hasRoleAtLeast } from '@template/shared/schemas/user.schema';

import { dashboardBoardsApi } from '../api/dashboard-boards.api';
import { ApiError, readError } from '../api/http-client';
import { mockAuth } from '../auth/mock-user';
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
    /** Quem o filtro "Pessoa" oferece — as pessoas com acesso ao sistema; o filtro guarda o id. */
    people: PersonOption[];
  };
  state: {
    isLoading: boolean;
    isEditing: boolean;
    isSaving: boolean;
    isRefreshing: boolean;
    canEdit: boolean;
    canAdd: boolean;
    error: string | null;
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
    /** O editor avisa a cada mudança, e a pré-visualização busca os números dela. */
    onPreviewChange: (widget: Widget) => void;
    /** Quem vê escolheu um valor num filtro do painel — todos os blocos releem. */
    onFilterValueChange: (patch: Partial<BoardFilterValues>) => void;
    /** Montando: põe um filtro no painel (um de cada tipo) ou tira. */
    onAddBoardFilter: (kind: BoardFilterKind) => void;
    onRemoveBoardFilter: (id: string) => void;
  };
};

/** De quanto em quanto os números se renovam sozinhos. */
export const REFRESH_MS = 5 * 60 * 1000;

type Draft = { widgets: Widget[]; layout: LayoutItem[]; filters: BoardFilter[] };

export function useDashboardBoardModel(): DashboardBoardModel {
  const queryClient = useQueryClient();
  const isManager = hasRoleAtLeast(mockAuth.getUser().role, 'manager');
  const scopes = visibleScopes(isManager);
  const [scope, setScope] = useState<DashboardScope>('team');
  const [draft, setDraft] = useState<Draft | null>(null);
  const [editing, setEditing] = useState<DashboardBoardModel['data']['editing']>(null);
  const [chosen, setChosen] = useState<BoardFilterValues>(EMPTY_BOARD_FILTER_VALUES);
  const people = usePeopleModel();

  const board = useQuery({
    queryKey: ['dashboard-board', scope],
    queryFn: () => dashboardBoardsApi.board(scope).then(({ data }) => data.board),
  });
  const saved = savedFacts(board.data);
  const shown: Draft = draft ?? saved.content;
  /* Valor de um filtro que o painel não tem mais não vale: tirar o filtro solta o recorte. */
  const filterValues = activeValues(shown.filters, chosen);
  const results = useWidgetResults(shown.widgets, filterValues);
  const preview = useWidgetPreview(editing, filterValues);
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
      people: people.people,
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
      onPreviewChange: preview.onChange,
      onFilterValueChange: (patch) => setChosen((current) => ({ ...current, ...patch })),
      onAddBoardFilter: (kind) => edit((current) => addBoardFilter(current, kind)),
      onRemoveBoardFilter: (id) =>
        edit((current) => ({
          ...current,
          filters: current.filters.filter((filter) => filter.id !== id),
        })),
    },
  };
}

/** Um filtro de cada tipo: pedir um que o painel já tem não muda nada. */
export function addBoardFilter(current: Draft, kind: BoardFilterKind): Draft {
  if (current.filters.some((filter) => filter.kind === kind)) return current;
  const filter = { id: kind, kind, label: BOARD_FILTER_KIND_LABELS[kind] };

  return { ...current, filters: [...current.filters, filter] };
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

/** Os números de cada bloco — uma consulta por bloco, em cache pela pergunta, não pelo bloco. */
function useWidgetResults(
  widgets: Widget[],
  values: BoardFilterValues,
): Record<string, WidgetState> {
  const queries = useQueries({
    queries: widgets.map((widget) => {
      const query = queryOf(widget, values);

      return {
        queryKey: ['dashboard-board', 'data', query],
        queryFn: () => dashboardBoardsApi.data(query).then(({ data }) => data.result),
        refetchInterval: REFRESH_MS,
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
  const category = Object.entries(dimensionsOf(source)).find(([, dimension]) => dimension.kind === 'category');

  return {
    id: `w${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
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

/**
 * A pergunta de um bloco — a mesma pergunta em dois blocos usa a mesma consulta em cache. Os
 * filtros do painel entram só onde valem: "Pessoa" num bloco sem pessoa ficaria na chave do
 * cache sem mudar a resposta, e faria o bloco recarregar à toa.
 */
export function queryOf(
  widget: Widget,
  values: BoardFilterValues = EMPTY_BOARD_FILTER_VALUES,
): WidgetQuery {
  return {
    source: widget.source,
    groupBy: widget.groupBy,
    splitBy: widget.splitBy,
    filterId: widget.filterId,
    onlyMine: widget.onlyMine,
    period: widget.period,
    window: widget.window,
    person: boardFilterApplies('person', widget.source) ? values.person : null,
    boardPeriod: values.period,
    matches: boardMatches(values, widget.source),
  };
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
