import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('./http-client', () => ({
  apiRequest: vi.fn().mockResolvedValue({}),
  apiUrl: (path: string) => `/api/v1${path}`,
}));

const { apiRequest } = await import('./http-client');
const { notificationsApi } = await import('./notifications.api');

beforeEach(() => vi.mocked(apiRequest).mockClear());

describe('notificationsApi', () => {
  // feliz
  it('pede o histórico com os filtros e grava a escolha do administrador', async () => {
    await notificationsApi.page({ page: 2, status: 'unread', severity: 'urgent' });
    await notificationsApi.saveSettings({
      settings: [{ topic: 'system.release', isEnabled: false, severity: 'normal' }],
    });
    await notificationsApi.inbox();
    await notificationsApi.settings();
    await notificationsApi.markManyRead(['a', 'b']);

    expect(apiRequest).toHaveBeenCalledWith('/notifications', {
      query: expect.objectContaining({ page: 2, status: 'unread', severity: 'urgent' }),
    });
    expect(apiRequest).toHaveBeenCalledWith('/notifications/settings', {
      method: 'PUT',
      body: { settings: [{ topic: 'system.release', isEnabled: false, severity: 'normal' }] },
    });
    expect(apiRequest).toHaveBeenCalledWith('/notifications/read', {
      method: 'POST',
      body: { ids: ['a', 'b'] },
    });
    expect(notificationsApi.streamUrl()).toBe('/api/v1/notifications/stream');
  });

  // triste
  it('marcar lida vai pela notificação, sem dizer de quem é', async () => {
    await notificationsApi.markRead('abc');
    await notificationsApi.markAllRead();

    expect(apiRequest).toHaveBeenCalledWith('/notifications/abc/read', { method: 'PATCH' });
    expect(apiRequest).toHaveBeenCalledWith('/notifications/read-all', { method: 'POST' });
  });
});
