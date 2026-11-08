import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { type ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { notificationFixture } from '../utils/notification-fixture.util';
import { nextSnapshot, useNotificationCenterModel } from './use-notification-center.model';

const navigate = vi.fn();
vi.mock('@tanstack/react-router', () => ({ useNavigate: () => navigate }));
const toast = vi.fn();
vi.mock('sonner', () => ({ toast: (...args: unknown[]) => toast(...args) }));
vi.mock('../api/notifications.api', () => ({
  notificationsApi: {
    inbox: vi.fn(),
    markRead: vi.fn(),
    markManyRead: vi.fn(),
    markAllRead: vi.fn(),
    streamUrl: vi.fn(),
  },
}));

const { notificationsApi } = await import('../api/notifications.api');

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

function answering(items = [notificationFixture('normal'), notificationFixture('urgent')]) {
  vi.mocked(notificationsApi.inbox).mockResolvedValue({ items, unread: items.length });
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(notificationsApi.markRead).mockResolvedValue({} as never);
});

describe('useNotificationCenterModel', () => {
  // feliz
  it('ao entrar com não lidas, abre o diálogo com a urgente primeiro', async () => {
    answering();
    const { result } = renderHook(useNotificationCenterModel, { wrapper });

    await waitFor(() => expect(result.current.state.isDialogOpen).toBe(true));
    expect(result.current.data.dialogItems.map((item) => item.severity)).toEqual([
      'urgent',
      'normal',
    ]);
    expect(result.current.data.unread).toBe(2);
    expect(toast).not.toHaveBeenCalled();
  });

  // feliz
  it('abrir uma notificação marca lida, fecha o diálogo e leva ao assunto', async () => {
    answering();
    const { result } = renderHook(useNotificationCenterModel, { wrapper });
    await waitFor(() => expect(result.current.state.isDialogOpen).toBe(true));

    act(() => result.current.actions.onOpen(notificationFixture('normal')));

    await waitFor(() => expect(notificationsApi.markRead).toHaveBeenCalled());
    expect(navigate).toHaveBeenCalledWith({ to: '/tasks' });
    expect(result.current.state.isDialogOpen).toBe(false);
    expect(result.current.state.canManage).toBe(true);

    act(() => result.current.actions.onOpenHistory());
    expect(navigate).toHaveBeenCalledWith({ to: '/profile', search: { tab: 'notifications' } });
  });

  // feliz
  it('com o sistema aberto, a novidade que chega vira toast, e a urgente abre o diálogo', async () => {
    answering([]);
    const { result } = renderHook(useNotificationCenterModel, { wrapper });
    await waitFor(() => expect(result.current.state.isLoading).toBe(false));

    answering([notificationFixture('normal'), notificationFixture('urgent')]);
    act(() => result.current.actions.onMarkAllRead());

    await waitFor(() => expect(result.current.state.isDialogOpen).toBe(true));
    expect(result.current.data.dialogItems.map((item) => item.severity)).toEqual(['urgent']);
    expect(toast).toHaveBeenCalledWith(
      expect.stringContaining('Ana comentou numa tarefa sua'),
      expect.objectContaining({ id: notificationFixture('normal').id }),
    );
  });

  // feliz
  it('o diálogo grava as lidas no servidor numa chamada só, e lista vazia não chama', async () => {
    answering();
    vi.mocked(notificationsApi.markManyRead).mockResolvedValue({ updated: 2 });
    const { result } = renderHook(useNotificationCenterModel, { wrapper });
    await waitFor(() => expect(result.current.state.isDialogOpen).toBe(true));

    act(() => result.current.actions.onMarkRead([]));
    act(() => result.current.actions.onMarkRead(['a', 'b']));

    await waitFor(() => expect(notificationsApi.markManyRead).toHaveBeenCalledTimes(1));
    expect(vi.mocked(notificationsApi.markManyRead).mock.calls[0]?.[0]).toEqual(['a', 'b']);
  });

  // triste
  it('sem não lidas, o diálogo não abre', async () => {
    answering([]);
    const { result } = renderHook(useNotificationCenterModel, { wrapper });

    await waitFor(() => expect(result.current.state.isLoading).toBe(false));
    expect(result.current.state.isDialogOpen).toBe(false);
  });
});

describe('nextSnapshot', () => {
  const empty = { data: undefined, known: null, arrived: [], isFirst: false };

  // feliz
  it('a primeira leitura não anuncia nada: é o que o diálogo de entrada mostra', () => {
    const first = nextSnapshot(empty, [notificationFixture('normal')], 1);

    expect(first).toMatchObject({ isFirst: true, arrived: [] });
  });

  // triste
  it('as seguintes anunciam só o que é novo de verdade', () => {
    const first = nextSnapshot(empty, [notificationFixture('normal')], 1);
    const fresh = notificationFixture('important');

    const second = nextSnapshot(first, [notificationFixture('normal'), fresh], 2);

    expect(second.arrived).toEqual([fresh]);
    expect(nextSnapshot(second, [fresh], 3).arrived).toEqual([]);
  });
});
