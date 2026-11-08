import { renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { MOCK_SESSION_USER, mockAuth } from '../auth/mock-user';
import { useProfileTabModel } from './use-profile-tab.model';

let search: Record<string, unknown> = {};
vi.mock('@tanstack/react-router', () => ({
  useSearch: () => search,
}));

function as(role: 'admin' | 'editor' | 'viewer') {
  vi.spyOn(mockAuth, 'getUser').mockReturnValue({ ...MOCK_SESSION_USER, role });
}

beforeEach(() => {
  search = {};
});

afterEach(() => vi.restoreAllMocks());

describe('useProfileTabModel', () => {
  // feliz
  it('opens the full history when the bell asks for it, and lets the administrator manage', () => {
    as('admin');
    search = { tab: 'notifications' };
    const { result } = renderHook(useProfileTabModel);

    expect(result.current.data.opensHistory).toBe(true);
    expect(result.current.state.canManage).toBe(true);
  });

  // triste
  it('keeps the history as a summary and hides the settings from someone not allowed', () => {
    as('editor');
    search = { tab: 'settings' };
    const { result } = renderHook(useProfileTabModel);

    expect(result.current.data.opensHistory).toBe(false);
    expect(result.current.state.canManage).toBe(false);
  });
});
