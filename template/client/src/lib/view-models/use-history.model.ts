import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useState } from 'react';

import {
  HISTORY_TARGET_LABELS,
  type HistoryAction,
  historyActionLabel,
  type HistoryEntry,
  type HistoryQuery,
  type HistoryTargetType,
} from '@template/shared/schemas/history.schema';
import { DEFAULT_PAGE_SIZE } from '@template/shared/schemas/pagination.schema';

import { historyApi } from '../api/history.api';
import { readError } from '../api/http-client';
import { type AzuosHistoryEntry } from '../components/azuos-history-timeline/azuos-history-timeline.component';
import { type AzuosStatusBadgeTone } from '../components/azuos-status-badge/azuos-status-badge.component';

/**
 * O HISTÓRICO — quem mudou o quê e quando, no sistema inteiro. Zero JSX.
 *
 * Filtra por tipo do alvo, ação, "só o que eu fiz", período e o nome do alvo, e pagina: o
 * histórico só cresce. Cada linha diz o que mudou campo a campo ("Status: Não iniciado → Em
 * andamento"), que é o que responde "quem mudou isso?".
 */
export type HistoryFilter = {
  who: 'all' | 'mine';
  targetType: HistoryTargetType | '';
  action: HistoryAction | '';
  search: string;
  from: string | null;
  to: string | null;
};

export type HistoryModel = {
  data: {
    entries: AzuosHistoryEntry[];
    filter: HistoryFilter;
    page: number;
    pageSize: number;
    total: number;
  };
  state: { isLoading: boolean; isFetching: boolean; error: string | null };
  actions: {
    onFilterChange: (patch: Partial<HistoryFilter>) => void;
    onClearFilters: () => void;
    onPageChange: (page: number) => void;
  };
};

export const EMPTY_HISTORY_FILTER: HistoryFilter = {
  who: 'all',
  targetType: '',
  action: '',
  search: '',
  from: null,
  to: null,
};

export function useHistoryModel(): HistoryModel {
  const [filter, setFilter] = useState<HistoryFilter>(EMPTY_HISTORY_FILTER);
  const [page, setPage] = useState(1);
  const query = toQuery(filter, page);

  const list = useQuery({
    queryKey: ['history', query],
    queryFn: () => historyApi.list(query),
    placeholderData: keepPreviousData,
  });

  return {
    data: {
      entries: (list.data?.items ?? []).map(toTimelineEntry),
      filter,
      page,
      pageSize: DEFAULT_PAGE_SIZE,
      total: list.data?.total ?? 0,
    },
    state: {
      isLoading: list.isLoading,
      isFetching: list.isFetching,
      error: readError(list.error),
    },
    actions: {
      onFilterChange: (patch) => {
        setFilter((current) => ({ ...current, ...patch }));
        setPage(1);
      },
      onClearFilters: () => {
        setFilter(EMPTY_HISTORY_FILTER);
        setPage(1);
      },
      onPageChange: setPage,
    },
  };
}

export function toQuery(filter: HistoryFilter, page: number): Partial<HistoryQuery> {
  return {
    page,
    pageSize: DEFAULT_PAGE_SIZE,
    actor: filter.who === 'mine' ? 'me' : undefined,
    targetType: filter.targetType || undefined,
    action: filter.action || undefined,
    search: filter.search.trim() || undefined,
    from: filter.from ?? undefined,
    to: filter.to ?? undefined,
  };
}

/** A cor do selo pelo que a ação fez: criar, concluir, alterar ou tirar de circulação. */
export function toneOfAction(action: string): AzuosStatusBadgeTone {
  if (/\.(completed|restored|reviewed)$/.test(action)) return 'success';
  if (/\.(created|added|amendment_created)$/.test(action)) return 'brand';
  if (/\.(deleted|archived|removed|cleared|amendment_deleted)$/.test(action)) return 'danger';

  return 'info';
}

/** "Alvará · BOMBEIRO · Padaria" e, embaixo, "Status: Não iniciado → Em andamento". */
export function toTimelineEntry(entry: HistoryEntry): AzuosHistoryEntry {
  const targetType = HISTORY_TARGET_LABELS[entry.target.type as HistoryTargetType] ?? 'Registro';
  const changes = entry.changes
    .map((change) => `${change.field}: ${change.from ?? '—'} → ${change.to ?? '—'}`)
    .join(' · ');

  return {
    id: entry.id,
    kindLabel: historyActionLabel(entry.action),
    tone: toneOfAction(entry.action),
    authorName: entry.actor.name ?? 'Sistema',
    createdAt: entry.occurredAt,
    description: [`${targetType}: ${entry.target.label ?? entry.target.id}`, changes]
      .filter(Boolean)
      .join('\n'),
  };
}
