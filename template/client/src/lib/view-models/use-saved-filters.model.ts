import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import {
  DATA_SOURCE_KEYS,
  type DataSourceKey,
  EMPTY_FILTER,
  type FilterGroup,
  filterProblems,
  type SavedFilter,
  type SaveFilterInput,
} from '@template/shared/schemas/dashboard-board.schema';

import { dashboardBoardsApi } from '../api/dashboard-boards.api';
import { readError } from '../api/http-client';
import { type PersonOption, usePeopleModel } from './use-people.model';

/**
 * OS FILTROS SALVOS DO SISTEMA e a tela que os monta. Zero JSX.
 *
 * A tela de montar é grande (abre por cima de tudo): a árvore de grupos E/OU, o nome, a fonte e
 * se é só da pessoa ou da equipe. Os limites são os do contrato — o mesmo que o servidor
 * confere —, e a tela diz o que está errado ANTES de tentar gravar.
 */
export type FilterDraft = SaveFilterInput & { id: string | null };

export type SavedFiltersModel = {
  data: {
    filters: SavedFilter[];
    archived: SavedFilter[];
    draft: FilterDraft | null;
    problems: string[];
    /** Quem pode ser escolhido num campo de pessoa — a condição guarda o id. */
    people: PersonOption[];
  };
  state: { isLoading: boolean; isSaving: boolean; isOpen: boolean; error: string | null };
  actions: {
    onOpenNew: (source?: DataSourceKey) => void;
    onOpenExisting: (id: string) => void;
    onClose: () => void;
    onDraftChange: (patch: Partial<FilterDraft>) => void;
    onTreeChange: (tree: FilterGroup) => void;
    onSave: () => void;
    onArchive: (id: string) => void;
    onRestore: (id: string) => void;
  };
};

const FILTERS_KEY = ['dashboard-filters'] as const;

export function useSavedFiltersModel(onSaved?: (filter: SavedFilter) => void): SavedFiltersModel {
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState<FilterDraft | null>(null);
  const people = usePeopleModel();

  const filters = useQuery({
    queryKey: [...FILTERS_KEY, 'hide'],
    queryFn: () => dashboardBoardsApi.filters('hide'),
  });
  const archived = useQuery({
    queryKey: [...FILTERS_KEY, 'only'],
    queryFn: () => dashboardBoardsApi.filters('only'),
    enabled: draft !== null,
  });
  const refresh = () => void queryClient.invalidateQueries({ queryKey: FILTERS_KEY });

  const save = useMutation({
    mutationFn: ({ id, ...input }: FilterDraft) =>
      id ? dashboardBoardsApi.updateFilter(id, input) : dashboardBoardsApi.createFilter(input),
    onSuccess: ({ data }) => {
      refresh();
      setDraft(null);
      onSaved?.(data.filter);
    },
  });
  const archive = useMutation({ mutationFn: dashboardBoardsApi.archiveFilter, onSettled: refresh });
  const restore = useMutation({ mutationFn: dashboardBoardsApi.restoreFilter, onSettled: refresh });

  const list = filters.data?.data.filters ?? [];
  const problems = draft ? draftProblems(draft) : [];

  return {
    data: {
      filters: list,
      archived: archived.data?.data.filters ?? [],
      draft,
      problems,
      people: people.people,
    },
    state: {
      isLoading: filters.isLoading,
      isSaving: save.isPending,
      isOpen: draft !== null,
      error:
        readError(filters.error) ??
        readError(save.error) ??
        readError(archive.error) ??
        readError(restore.error),
    },
    actions: {
      onOpenNew: (source = DATA_SOURCE_KEYS[0]!) =>
        setDraft({
          id: null,
          name: '',
          description: null,
          source,
          scope: 'personal',
          tree: EMPTY_FILTER,
        }),
      onOpenExisting: (id) => {
        const found = list.find((filter) => filter.id === id);
        if (!found) return;
        setDraft({
          id: found.id,
          name: found.name,
          description: found.description,
          source: found.source,
          scope: found.scope,
          tree: found.tree,
        });
      },
      onClose: () => {
        setDraft(null);
        save.reset();
      },
      onDraftChange: (patch) =>
        setDraft((current) => {
          if (!current) return current;
          /* Trocar a fonte zera a árvore: os campos de uma não existem na outra. */
          const resetsTree = patch.source !== undefined && patch.source !== current.source;

          return { ...current, ...patch, ...(resetsTree ? { tree: EMPTY_FILTER } : {}) };
        }),
      onTreeChange: (tree) => setDraft((current) => (current ? { ...current, tree } : current)),
      onSave: () => {
        if (draft && draftProblems(draft).length === 0) save.mutate(draft);
      },
      onArchive: (id) => archive.mutate(id),
      onRestore: (id) => restore.mutate(id),
    },
  };
}

export function draftProblems(draft: FilterDraft): string[] {
  const problems = draft.name.trim().length < 2 ? ['Dê um nome ao filtro.'] : [];

  return [...problems, ...filterProblems(draft.source, draft.tree)];
}
