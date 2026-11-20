import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { type UserRole } from '@template/shared/schemas/user.schema';
import { type ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { MOCK_SESSION_USER, mockAuth } from '../auth/mock-user';
import { useNotificationSettingsModel } from './use-notification-settings.model';

vi.mock('../api/notifications.api', () => ({
  notificationsApi: { settings: vi.fn(), saveSettings: vi.fn() },
}));

const { notificationsApi } = await import('../api/notifications.api');

const LIST = {
  items: [{ topic: 'system.release' as const, isEnabled: true, severity: 'info' as const }],
};

function wrapper({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
      {children}
    </QueryClientProvider>
  );
}

function as(role: UserRole) {
  vi.spyOn(mockAuth, 'getUser').mockReturnValue({ ...MOCK_SESSION_USER, role });
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(notificationsApi.settings).mockResolvedValue(LIST);
});

afterEach(() => vi.restoreAllMocks());

describe('useNotificationSettingsModel', () => {
  // feliz
  it('lets the administrator change a draft and save it all on Salvar', async () => {
    as('admin');
    vi.mocked(notificationsApi.saveSettings).mockResolvedValue(LIST);
    const { result } = renderHook(useNotificationSettingsModel, { wrapper });
    await waitFor(() => expect(result.current.data.settings).toHaveLength(1));

    act(() => result.current.actions.onToggle('system.release', false));
    act(() => result.current.actions.onSeverityChange('system.release', 'urgent'));
    expect(result.current.state.isDirty).toBe(true);
    expect(result.current.data.settings[0]).toMatchObject({ isEnabled: false, severity: 'urgent' });

    act(() => result.current.actions.onSave());
    await waitFor(() => expect(result.current.state.savedAt).not.toBeNull());
    expect(notificationsApi.saveSettings).toHaveBeenCalledWith({
      settings: [{ topic: 'system.release', isEnabled: false, severity: 'urgent' }],
    });
  });

  // triste
  it('does not even fetch for non-administrators', () => {
    as('owner');
    const { result } = renderHook(useNotificationSettingsModel, { wrapper });

    expect(result.current.state.canManage).toBe(false);
    expect(notificationsApi.settings).not.toHaveBeenCalled();
  });

  // triste
  it('throws the draft away on undo', async () => {
    as('admin');
    const { result } = renderHook(useNotificationSettingsModel, { wrapper });
    await waitFor(() => expect(result.current.data.settings).toHaveLength(1));

    act(() => result.current.actions.onToggle('system.release', false));
    act(() => result.current.actions.onDiscard());

    expect(result.current.state.isDirty).toBe(false);
    expect(result.current.data.settings[0]?.isEnabled).toBe(true);
  });
});
