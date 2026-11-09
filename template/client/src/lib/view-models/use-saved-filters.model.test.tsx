import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { type ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { type SavedFilter } from '@template/shared/schemas/dashboard-board.schema';

import { ApiError } from '../api/http-client';
import { draftProblems, useSavedFiltersModel } from './use-saved-filters.model';

vi.mock('../api/users.api', () => ({
  usersApi: { list: vi.fn(async () => ({ people: [], isConnected: false })) },
}));

vi.mock('../api/dashboard-boards.api', () => ({
  dashboardBoardsApi: {
    filters: vi.fn(),
    createFilter: vi.fn(),
    updateFilter: vi.fn(),
    archiveFilter: vi.fn(),
    restoreFilter: vi.fn(),
  },
}));

const { dashboardBoardsApi } = await import('../api/dashboard-boards.api');

const MINE: SavedFilter = {
  id: '0190a000-0000-7000-8000-000000000001',
  name: 'Só as minhas',
  description: null,
  source: 'tasks',
  scope: 'personal',
  tree: { combinator: 'and', rules: [{ field: 'createdBy', operator: '=', value: '@me' }] },
  ownerId: '00000000-0000-0000-0000-000000000001',
  ownerName: 'Leyla',
  canEdit: true,
  archive: null,
  updatedAt: '2026-11-01T12:00:00.000Z',
};

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

describe('useSavedFiltersModel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(dashboardBoardsApi.filters).mockImplementation(
      async (archived) =>
        ({
          data: { filters: archived === 'only' ? [] : [MINE] },
          links: {},
        }) as never,
    );
  });

  // feliz
  it('opens a saved filter to edit and saves the change by id', async () => {
    vi.mocked(dashboardBoardsApi.updateFilter).mockResolvedValue({
      data: { filter: MINE },
      links: {},
    } as never);
    const onSaved = vi.fn();
    const { result } = renderHook(() => useSavedFiltersModel(onSaved), { wrapper });
    await waitFor(() => expect(result.current.data.filters).toEqual([MINE]));

    act(() => result.current.actions.onOpenExisting(MINE.id));
    act(() => result.current.actions.onDraftChange({ name: 'Os meus' }));
    act(() => result.current.actions.onSave());

    await waitFor(() => expect(onSaved).toHaveBeenCalledWith(MINE));
    expect(dashboardBoardsApi.updateFilter).toHaveBeenCalledWith(MINE.id, {
      name: 'Os meus',
      description: null,
      source: 'tasks',
      scope: 'personal',
      tree: MINE.tree,
    });
    expect(result.current.state.isOpen).toBe(false);
  });

  // feliz
  it('resets the tree when the source changes, since fields do not carry over', async () => {
    const { result } = renderHook(() => useSavedFiltersModel(), { wrapper });
    await waitFor(() => expect(result.current.data.filters).toHaveLength(1));

    act(() => result.current.actions.onOpenExisting(MINE.id));
    act(() => result.current.actions.onDraftChange({ source: 'activity' }));
    expect(result.current.data.draft?.tree).toEqual({ combinator: 'and', rules: [] });
  });

  // triste
  it('does not save without a name and says why', async () => {
    const { result } = renderHook(() => useSavedFiltersModel(), { wrapper });

    act(() => result.current.actions.onOpenNew());
    expect(result.current.data.problems).toContain('Dê um nome ao filtro.');
    act(() => result.current.actions.onSave());
    expect(dashboardBoardsApi.createFilter).not.toHaveBeenCalled();
  });

  // triste
  it('shows an archiving failure as an error', async () => {
    vi.mocked(dashboardBoardsApi.archiveFilter).mockRejectedValue(
      new ApiError(403, 'Sem permissão'),
    );
    const { result } = renderHook(() => useSavedFiltersModel(), { wrapper });

    act(() => result.current.actions.onArchive(MINE.id));
    await waitFor(() => expect(result.current.state.error).toBe('Sem permissão'));
  });
});

describe('draftProblems', () => {
  // triste
  it('points out a field the source does not have', () => {
    const problems = draftProblems({
      id: null,
      name: 'Teste',
      description: null,
      source: 'activity',
      scope: 'personal',
      tree: {
        combinator: 'and',
        rules: [{ field: 'status', operator: '=', value: 'done' }],
      },
    });

    expect(problems.length).toBeGreaterThan(0);
  });
});
