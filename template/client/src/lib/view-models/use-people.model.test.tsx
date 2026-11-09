import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { type ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { usePeopleModel } from './use-people.model';

vi.mock('../api/users.api', () => ({ usersApi: { list: vi.fn() } }));

const { usersApi } = await import('../api/users.api');

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

describe('usePeopleModel', () => {
  // feliz
  it('offers each person with id, name and photo, the e-mail standing in for a missing name', async () => {
    vi.mocked(usersApi.list).mockResolvedValue({
      people: [
        { id: '1', name: 'Ana', email: 'ana@x', avatarUrl: 'https://foto' },
        { id: '2', name: '', email: 'bia@x', avatarUrl: null },
      ],
      isConnected: true,
    });

    const { result } = renderHook(usePeopleModel, { wrapper });

    await waitFor(() => expect(result.current.people).toHaveLength(2));
    expect(result.current.people[1]).toEqual({ id: '2', name: 'bia@x', photo: null });
    expect(result.current.isConnected).toBe(true);
  });

  // triste
  it('says the list is short because of an error', async () => {
    vi.mocked(usersApi.list).mockRejectedValue(new Error('503'));

    const { result } = renderHook(usePeopleModel, { wrapper });

    await waitFor(() => expect(result.current.isUnavailable).toBe(true));
    expect(result.current.people).toEqual([]);
  });
});
