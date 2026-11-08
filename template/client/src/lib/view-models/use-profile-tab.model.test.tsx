import { renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { MOCK_SESSION_USER, mockAuth } from '../auth/mock-user';
import { useProfileTabModel } from './use-profile-tab.model';

const navigate = vi.fn();
let search: Record<string, unknown> = {};
vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => navigate,
  useSearch: () => search,
}));

function as(role: 'admin' | 'editor' | 'viewer') {
  vi.spyOn(mockAuth, 'getUser').mockReturnValue({ ...MOCK_SESSION_USER, role });
}

beforeEach(() => {
  vi.clearAllMocks();
  search = {};
});

afterEach(() => vi.restoreAllMocks());

describe('useProfileTabModel', () => {
  // feliz
  it('o administrador tem as três abas e troca pelo endereço', () => {
    as('admin');
    search = { tab: 'settings' };
    const { result } = renderHook(useProfileTabModel);

    expect(result.current.data.options.map((option) => option.value)).toEqual([
      'profile',
      'notifications',
      'settings',
    ]);
    expect(result.current.data.tab).toBe('settings');
    result.current.actions.onChange('notifications');
    expect(navigate).toHaveBeenCalledWith({ to: '/profile', search: { tab: 'notifications' } });
  });

  // triste
  it('"O que notificar" pedida por quem não pode vira a ficha', () => {
    as('editor');
    search = { tab: 'settings' };
    const { result } = renderHook(useProfileTabModel);

    expect(result.current.data.tab).toBe('profile');
    expect(result.current.data.options).toHaveLength(2);
  });
});
