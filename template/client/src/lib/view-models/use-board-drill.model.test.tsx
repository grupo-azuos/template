import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { type ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { boardDrillSchema } from '@template/shared/schemas/board-drill.schema';

import { dashboardBoardsApi } from '../api/dashboard-boards.api';
import { DRILL_FILTER_GONE, useBoardDrillModel } from './use-board-drill.model';

const navigate = vi.fn();
vi.mock('@tanstack/react-router', () => ({ useNavigate: () => navigate }));

vi.mock('./use-people.model', () => ({
  usePeopleModel: () => ({ people: [{ id: 'u-bia', name: 'Bia', photo: null }] }),
}));

vi.mock('../api/dashboard-boards.api', () => ({
  dashboardBoardsApi: { filters: vi.fn() },
}));

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

const DRILL = boardDrillSchema.parse({
  source: 'tasks',
  groupBy: 'status',
  filterId: null,
  key: 'done',
  label: 'Concluída',
  title: 'Tarefas por status',
  person: 'u-bia',
});

describe('useBoardDrillModel', () => {
  // feliz
  it('says the cut in words, with the name of the person, and clears it back to the list', () => {
    const { result } = renderHook(() => useBoardDrillModel(DRILL, '/tasks'), { wrapper });

    expect(result.current.drill).toEqual(DRILL);
    expect(result.current.banner?.summary).toContain('Responsável: Bia');
    act(() => result.current.onClear());
    act(() => result.current.onBack());

    expect(navigate).toHaveBeenCalledWith({ to: '/tasks', search: {} });
    expect(navigate).toHaveBeenCalledWith({ to: '/dashboard' });
  });

  // feliz
  it('has no banner without a cut', () => {
    const { result } = renderHook(() => useBoardDrillModel(undefined, '/tasks'), { wrapper });

    expect(result.current.banner).toBeNull();
  });

  // triste
  it('opens without the cut, and warns, when its saved filter is gone', async () => {
    vi.mocked(dashboardBoardsApi.filters).mockResolvedValue({ data: { filters: [] } } as never);
    const drill = { ...DRILL, filterId: '0196f3e8-0000-7000-8000-00000000f001' };
    const { result } = renderHook(() => useBoardDrillModel(drill, '/tasks'), { wrapper });

    await waitFor(() => expect(result.current.banner?.notice).toBe(DRILL_FILTER_GONE));
    expect(result.current.drill).toBeNull();
  });
});
