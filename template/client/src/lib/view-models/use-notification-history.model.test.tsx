import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { createElement, type ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ApiError } from '../api/http-client';
import { ALL_SEVERITY_NOTIFICATIONS } from '../utils/notification-fixture.util';
import { useNotificationHistoryModel } from './use-notification-history.model';

const navigate = vi.fn();
vi.mock('@tanstack/react-router', () => ({ useNavigate: () => navigate }));
vi.mock('../api/notifications.api', () => ({
  notificationsApi: { page: vi.fn(), markRead: vi.fn(), markAllRead: vi.fn() },
}));

const { notificationsApi } = await import('../api/notifications.api');

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });

  return createElement(QueryClientProvider, { client }, children);
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(notificationsApi.page).mockResolvedValue({
    items: ALL_SEVERITY_NOTIFICATIONS,
    total: 64,
    page: 1,
    pageSize: 20,
  });
});

describe('useNotificationHistoryModel', () => {
  // feliz
  it('busca paginado, e filtrar volta à primeira página', async () => {
    const { result } = renderHook(useNotificationHistoryModel, { wrapper });
    await waitFor(() => expect(result.current.data.items).toHaveLength(4));
    expect(result.current.data.pagination.total).toBe(64);

    act(() => result.current.actions.onPageChange(3));
    act(() => result.current.actions.onFiltersChange({ severity: 'urgent' }));

    await waitFor(() =>
      expect(notificationsApi.page).toHaveBeenLastCalledWith(
        expect.objectContaining({ page: 1, severity: 'urgent', pageSize: 20 }),
      ),
    );
    expect(result.current.state.hasFilters).toBe(true);
    act(() => result.current.actions.onClearFilters());
    expect(result.current.state.hasFilters).toBe(false);
  });

  // feliz
  it('abrir marca lida e leva ao assunto; marcar todas vai ao servidor', async () => {
    vi.mocked(notificationsApi.markRead).mockResolvedValue({} as never);
    vi.mocked(notificationsApi.markAllRead).mockResolvedValue({ updated: 4 });
    const { result } = renderHook(useNotificationHistoryModel, { wrapper });
    await waitFor(() => expect(result.current.data.items).toHaveLength(4));

    act(() => result.current.actions.onOpen(ALL_SEVERITY_NOTIFICATIONS[0]!));
    act(() => result.current.actions.onMarkAllRead());

    await waitFor(() => expect(notificationsApi.markAllRead).toHaveBeenCalled());
    expect(notificationsApi.markRead).toHaveBeenCalled();
    expect(navigate).toHaveBeenCalledWith({ to: '/tasks' });
  });

  // triste
  it('a falha da busca chega com o motivo', async () => {
    vi.mocked(notificationsApi.page).mockRejectedValue(new ApiError(503, 'fora do ar'));
    const { result } = renderHook(useNotificationHistoryModel, { wrapper });

    await waitFor(() => expect(result.current.state.error).toBe('fora do ar'));
  });
});
