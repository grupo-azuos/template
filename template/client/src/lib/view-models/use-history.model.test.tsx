import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { type ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  EMPTY_HISTORY_FILTER,
  toneOfAction,
  toQuery,
  toTimelineEntry,
  useHistoryModel,
} from './use-history.model';

vi.mock('../api/history.api', () => ({ historyApi: { list: vi.fn() } }));

const { historyApi } = await import('../api/history.api');

const ENTRY = {
  id: '7',
  action: 'task.updated',
  target: { type: 'task', id: '12', label: 'Ligar para o cliente' },
  changes: [{ field: 'Status', from: 'todo', to: 'done' }],
  actor: { id: 'u1', name: 'Ana Souza' },
  occurredAt: '2026-11-07T12:00:00.000Z',
};

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

describe('useHistoryModel', () => {
  beforeEach(() => {
    vi.mocked(historyApi.list).mockResolvedValue({
      items: [ENTRY],
      total: 1,
      page: 1,
      pageSize: 50,
    });
  });

  // feliz
  it('lists rows ready for the timeline', async () => {
    const { result } = renderHook(useHistoryModel, { wrapper });

    await waitFor(() => expect(result.current.data.total).toBe(1));
    expect(result.current.data.entries[0]).toMatchObject({
      kindLabel: 'Alterou a tarefa',
      authorName: 'Ana Souza',
      tone: 'info',
    });
  });

  // triste
  it('goes back to the first page on filter change and asks for "what I did"', async () => {
    const { result } = renderHook(useHistoryModel, { wrapper });

    act(() => result.current.actions.onPageChange(4));
    act(() => result.current.actions.onFilterChange({ who: 'mine' }));

    expect(result.current.data.page).toBe(1);
    await waitFor(() =>
      expect(historyApi.list).toHaveBeenLastCalledWith(
        expect.objectContaining({ actor: 'me', page: 1 }),
      ),
    );
  });
});

describe('history helpers', () => {
  // feliz
  it('describes the target and what changed, field by field', () => {
    expect(toTimelineEntry(ENTRY).description).toBe(
      'Tarefa: Ligar para o cliente\nStatus: todo → done',
    );
    expect(toneOfAction('task.created')).toBe('brand');
    expect(toneOfAction('task.deleted')).toBe('danger');
  });

  // triste
  it('shows an action from a newer version raw, and "Sistema" without an author', () => {
    const entry = toTimelineEntry({
      ...ENTRY,
      action: 'task.teleported',
      target: { type: 'planeta', id: 'x', label: null },
      changes: [],
      actor: { id: null, name: null },
    });

    expect(entry).toMatchObject({ kindLabel: 'task.teleported', authorName: 'Sistema' });
    expect(entry.description).toBe('Registro: x');
    expect(toQuery(EMPTY_HISTORY_FILTER, 1)).toMatchObject({ actor: undefined, action: undefined });
  });
});
