import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { type ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { MOCK_SESSION_USER } from '../auth/mock-user';
import { useProfileModel } from './use-profile.model';

vi.mock('../api/account-session.api', () => ({ accountProfileUrl: () => null }));
vi.mock('../api/account-profile.api', () => ({
  accountProfileApi: {
    me: vi.fn().mockRejectedValue(new Error('sem sessão no admin-console')),
    systems: vi.fn().mockRejectedValue(new Error('sem sessão no admin-console')),
  },
}));

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

describe('useProfileModel', () => {
  // feliz
  it('shows the signed-in person, read-only', async () => {
    const { result } = renderHook(() => useProfileModel(), { wrapper });
    await waitFor(() => expect(result.current.state.isLoading).toBe(false));

    expect(result.current.data.person).toMatchObject({
      name: MOCK_SESSION_USER.name,
      email: MOCK_SESSION_USER.email,
      roleLabel: 'Administrador',
    });
    expect(result.current.state.error).toBeNull();
  });

  // triste
  it('keeps the local identity when the admin console does not answer', async () => {
    const { result } = renderHook(() => useProfileModel(), { wrapper });
    await waitFor(() => expect(result.current.state.isLoading).toBe(false));

    expect(result.current.data.person).toMatchObject({ avatarUrl: null, jobTitle: null });
    expect(result.current.data.person?.systems).toBeUndefined();
  });
});
