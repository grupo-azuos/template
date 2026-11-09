import {
  CARD_WIDGETS,
  DATA_SOURCES,
  DAY_WIDGETS,
  DEFAULT_WINDOW,
  type DataDimension,
  type DataSourceKey,
  dimensionsOf,
  hasPersonField,
  PAIR_WIDGETS,
  type SavedFilter,
  type Widget,
  type WidgetKind,
} from '@template/shared/schemas/dashboard-board.schema';
import { DATA_SOURCE_KEYS } from '@template/shared/schemas/dashboard-board.schema';

import { suggestedTitle } from '../azuos-board-widget/widget-kind.util';

/**
 * AS ESCOLHAS DO EDITOR DE BLOCO — que agrupamentos cada gráfico aceita, e como o formulário se
 * acerta sozinho quando a pessoa troca o gráfico ou a fonte. Sem isto, trocar "Colunas" por
 * "Calendário" deixaria o bloco agrupado por status, e o servidor recusaria.
 */
export const NO_GROUP = '';
export const NO_FILTER = '';

type Option = { value: string; label: string };

/** Os gráficos que mostram um número só (sem agrupar). O destaque agrupa: os grupos viram cards. */
const SINGLE_VALUE: readonly WidgetKind[] = ['radial'];

export function isPair(kind: WidgetKind): boolean {
  return PAIR_WIDGETS.includes(kind);
}

export function usesGroup(kind: WidgetKind): boolean {
  return !SINGLE_VALUE.includes(kind);
}

/** Que agrupamentos cada gráfico aceita: categoria, dia ou mês. */
export function dimensionFits(kind: WidgetKind, dimension: DataDimension): boolean {
  if (DAY_WIDGETS.includes(kind)) return dimension.kind === 'day';
  if (kind === 'area') return dimension.kind !== 'category';
  if (!usesGroup(kind)) return false;

  return dimension.kind === 'category';
}

function categoryOptions(source: DataSourceKey, kind: WidgetKind): Option[] {
  const dimensions = dimensionsOf(source) as Record<string, DataDimension>;

  return Object.entries(dimensions)
    .filter(([, dimension]) => dimensionFits(kind, dimension))
    .map(([value, dimension]) => ({ value, label: dimension.label }));
}

export function groupOptions(widget: Widget): Option[] {
  const options = categoryOptions(widget.source, widget.kind);

  return CARD_WIDGETS.includes(widget.kind)
    ? [{ value: NO_GROUP, label: 'Sem agrupar (o total)' }, ...options]
    : options;
}

/** O "dividir por" dos blocos de par: as outras categorias da fonte. */
export function splitOptions(widget: Widget): Option[] {
  return categoryOptions(widget.source, widget.kind).filter(
    (option) => option.value !== widget.groupBy,
  );
}

/** Os filtros da mesma fonte, e o "sem filtro" na frente. */
export function filterOptions(filters: SavedFilter[], source: DataSourceKey): Option[] {
  const own = filters
    .filter((filter) => filter.source === source && !filter.archive)
    .map((filter) => ({
      value: filter.id,
      label: filter.scope === 'shared' ? `${filter.name} (compartilhado)` : filter.name,
    }));

  return [{ value: NO_FILTER, label: 'Sem filtro (tudo)' }, ...own];
}

/**
 * Depois de trocar o gráfico ou a fonte: o agrupamento que não serve mais vira o primeiro que
 * serve (ou nenhum, nos de número só), o "dividir por" fica só nos de par, e "só os meus" sai
 * da fonte que não tem responsável.
 */
export function fitGroup(input: Widget): Widget {
  const widget = fitAgenda(input);
  const onlyMine = widget.onlyMine && hasPersonField(widget.source);
  const window = widget.window;
  if (!usesGroup(widget.kind)) {
    return { ...widget, groupBy: null, splitBy: null, onlyMine, window };
  }
  const options = groupOptions(widget);
  const groupBy = options.some((option) => option.value === (widget.groupBy ?? NO_GROUP))
    ? widget.groupBy
    : options[0]?.value || null;

  return { ...widget, groupBy, splitBy: fitSplit({ ...widget, groupBy }), onlyMine, window };
}

/**
 * Só a agenda tem janela: ela nasce no mês de hoje, pra frente, e as outras ficam sem. Na agenda,
 * o "período" geral não vale (a janela já é o período), e a fonte sem dia vira a primeira que tem.
 */
function fitAgenda(widget: Widget): Widget {
  if (widget.kind !== 'agenda') return { ...widget, window: null };

  return {
    ...widget,
    source: sourceHasDays(widget.source)
      ? widget.source
      : (DATA_SOURCE_KEYS.find(sourceHasDays) ?? widget.source),
    period: 'all',
    window: widget.window ?? DEFAULT_WINDOW,
  };
}

/** As fontes que a agenda aceita: as que têm um agrupamento por dia. */
export function sourceHasDays(source: DataSourceKey): boolean {
  return Object.values(dimensionsOf(source) as Record<string, DataDimension>).some(
    (dimension) => dimension.kind === 'day',
  );
}

/** O título que o bloco sugere pelo que ele mostra — "Tarefas por status". */
export function autoTitle(widget: Widget): string {
  const dimensions = dimensionsOf(widget.source) as Record<string, DataDimension>;
  const group = widget.groupBy ? (dimensions[widget.groupBy]?.label ?? null) : null;

  return suggestedTitle(widget.kind, DATA_SOURCES[widget.source].noun, group);
}

/**
 * Depois de uma mudança: o título que ainda era a sugestão (ou vazio) acompanha o bloco; o que a
 * pessoa escreveu fica como ela escreveu.
 */
export function followTitle(before: Widget, after: Widget): Widget {
  const wasAuto = before.title === '' || before.title === autoTitle(before);
  if (!wasAuto || after.title !== before.title) return after;

  return { ...after, title: autoTitle(after) };
}

function fitSplit(widget: Widget): string | null {
  if (!isPair(widget.kind)) return null;
  const options = splitOptions(widget);
  if (options.some((option) => option.value === widget.splitBy)) return widget.splitBy;

  return options[0]?.value ?? null;
}
