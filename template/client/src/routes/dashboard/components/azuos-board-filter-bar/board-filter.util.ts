import {
  BOARD_FILTER_FIELDS,
  type BoardFieldFilterKind,
  type BoardFilter,
  boardFilterDisplay,
  type BoardFilterDisplay,
  boardFilterDisplaysOf,
  type BoardFilterKind,
  type BoardFilterPlace,
  type BoardFilterValues,
  DATA_SOURCES,
  type DataField,
  type DataSourceKey,
  MAX_WINDOW_DAYS,
  ME_VALUE,
  type WidgetWindow,
  windowLabel,
  windowRange,
} from '@template/shared/schemas/dashboard-board.schema';

import { type FilterCounts } from '../../../../lib/view-models/use-dashboard-board.model';
import { type PersonOption } from '../../../../lib/view-models/use-people.model';
import { optionLabel } from '../azuos-filter-builder-screen/azuos-filter-builder-screen.component';

/**
 * AS REGRAS DOS FILTROS DO PAINEL — as opções de cada filtro, os períodos prontos, o resumo do
 * que está valendo, os desenhos da barra e a ordem dela. Funções puras: a barra só desenha.
 */
export type BoardFilterOption = {
  value: string;
  label: string;
  personName?: string;
  avatarUrl?: string | null;
};

/** Até aqui, um seletor; daqui para cima, a lista ganha busca (regra dos 15 itens). */
export const SEARCH_FROM = 15;

/**
 * OS DESENHOS DA BARRA DE FILTROS — no estilo do Grafana, cada filtro é UMA peça compacta numa
 * linha só, acima dos blocos: a lista suspensa ou a busca — e os CARDS, num carrossel da largura
 * da barra, cada opção com quantos há nela. As etiquetas, a lista aberta e as fotos saíram (as
 * etiquetas rolavam de lado dentro da peça e cortavam as opções); um painel gravado com elas cai
 * na lista suspensa, ou na busca para pessoa.
 */
export const TOOLBAR_DISPLAYS: readonly BoardFilterDisplay[] = ['select', 'search', 'cards'];

/** Os desenhos que quem monta pode escolher para o filtro, na barra. */
export function toolbarDisplaysOf(kind: BoardFilterKind): BoardFilterDisplay[] {
  return boardFilterDisplaysOf(kind).filter((display) => TOOLBAR_DISPLAYS.includes(display));
}

/** O desenho do filtro na barra: o escolhido, se for compacto; senão, a busca (pessoa) ou a suspensa. */
export function toolbarDisplayOf(
  filter: Pick<BoardFilter, 'kind' | 'display'>,
): BoardFilterDisplay {
  const display = boardFilterDisplay(filter);
  if (toolbarDisplaysOf(filter.kind).includes(display)) return display;

  return filter.kind === 'person' ? 'search' : 'select';
}

/**
 * A ORDEM da barra gravada no lugar de cada filtro: a barra lê da esquerda para a direita, e a
 * grade guarda a ordem de leitura (linha, depois coluna). Cada filtro numa casa 1×1, em sequência.
 */
export function placesInOrder(
  ids: readonly string[],
  columns: number,
): { id: string; place: BoardFilterPlace }[] {
  return ids.map((id, index) => ({
    id,
    place: { x: index % columns, y: Math.floor(index / columns), w: 1, h: 1 },
  }));
}

/** A lista com o item `from` levado para a posição `to` — o arrastar e as setas da ordem. */
export function moveInList<T>(items: readonly T[], from: number, to: number): T[] {
  const isOutside = (index: number) => index < 0 || index >= items.length;
  if (from === to || isOutside(from) || isOutside(to)) return [...items];
  const next = [...items];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved as T);

  return next;
}

/** De cima para baixo e da esquerda para a direita: a ordem em que a barra lê os filtros. */
export function readingOrder<T extends { place: BoardFilterPlace }>(filters: readonly T[]): T[] {
  return [...filters].sort(
    (one, other) => one.place.y - other.place.y || one.place.x - other.place.x,
  );
}

/** Quantos há em cada opção, pela conta do filtro; "Todos" (valor vazio) é o total. */
export function optionCounts(counts: FilterCounts | null | undefined): Map<string, number> {
  const byKey = new Map((counts?.series ?? []).map((item) => [item.key, item.value]));
  byKey.set('', counts?.total ?? 0);

  return byKey;
}

/** Os filtros com valor escolhido, com o valor escrito como a pessoa o leu na tela. */
export function activeSummary(data: {
  filters: readonly BoardFilter[];
  values: BoardFilterValues;
  people?: readonly PersonOption[];
}): { label: string; value: string }[] {
  return data.filters.flatMap((filter) => {
    const value = valueLabel(filter.kind, data.values, data.people ?? []);

    return value ? [{ label: filter.label, value }] : [];
  });
}

function valueLabel(
  kind: BoardFilterKind,
  values: BoardFilterValues,
  people: readonly PersonOption[],
): string | null {
  if (kind === 'period') return values.period ? windowLabel(values.period) : null;
  const value = values[kind];
  if (!value) return null;
  if (kind === 'person') {
    return value === ME_VALUE
      ? 'Eu'
      : (people.find((person) => person.id === value)?.name ?? value);
  }

  return fieldFilterOptions(kind).find((option) => option.value === value)?.label ?? value;
}

/** Cada pessoa com o rosto: o filtro guarda o id; sem foto, o avatar cai nas iniciais. */
export function personOptions(people: readonly PersonOption[]): BoardFilterOption[] {
  return people.map((person) => ({
    value: person.id,
    label: person.name,
    personName: person.name,
    avatarUrl: person.photo,
  }));
}

/** Os valores de cada filtro de campo, com o rótulo em português. */
export function fieldFilterOptions(kind: BoardFieldFilterKind): BoardFilterOption[] {
  const [source, field] = Object.entries(BOARD_FILTER_FIELDS[kind])[0] as [DataSourceKey, string];
  const options = (DATA_SOURCES[source].fields as Record<string, DataField>)[field]?.options ?? [];

  return options.map((option) => ({ value: option, label: optionLabel(source, option) }));
}

const relative = (
  direction: 'next' | 'last',
  count: number,
  unit: 'day' | 'week' | 'month',
): WidgetWindow => ({ mode: 'relative', direction, count, unit });

/** Os períodos prontos — o que mais se pergunta, sem abrir calendário. */
export const PERIOD_PRESETS: { value: string; label: string; window: WidgetWindow | null }[] = [
  { value: 'each', label: 'O de cada bloco', window: null },
  { value: 'last-7-day', label: 'Últimos 7 dias', window: relative('last', 7, 'day') },
  { value: 'last-30-day', label: 'Últimos 30 dias', window: relative('last', 30, 'day') },
  { value: 'last-90-day', label: 'Últimos 90 dias', window: relative('last', 90, 'day') },
  { value: 'last-1-month', label: 'Este mês', window: relative('last', 1, 'month') },
  { value: 'next-30-day', label: 'Próximos 30 dias', window: relative('next', 30, 'day') },
  { value: 'custom', label: 'Datas exatas', window: null },
];

/** Qual opção pronta é a janela escolhida — `custom` para datas exatas. */
export function presetOf(window: WidgetWindow | null): string {
  if (!window) return 'each';
  if (window.mode === 'custom') return 'custom';

  return `${window.direction}-${window.count}-${window.unit}`;
}

/** A janela de uma opção pronta. "Datas exatas" nasce nos últimos 30 dias, para ajustar. */
export function windowOfPreset(value: string, today: string): WidgetWindow | null {
  if (value === 'custom') {
    return { mode: 'custom', ...windowRange(relative('last', 30, 'day'), today) };
  }

  return PERIOD_PRESETS.find((preset) => preset.value === value)?.window ?? null;
}

/**
 * Datas exatas nunca passam de 90 dias: a data final escolhida longe demais é puxada para o
 * 90º dia — melhor que recusar sem dizer o que fazer.
 */
export function clampRange(from: string, to: string): { from: string; to: string } {
  const [start, end] = from <= to ? [from, to] : [to, from];
  const limit = new Date(`${start}T00:00:00.000Z`);
  limit.setUTCDate(limit.getUTCDate() + MAX_WINDOW_DAYS - 1);
  const last = limit.toISOString().slice(0, 10);

  return { from: start, to: end > last ? last : end };
}
