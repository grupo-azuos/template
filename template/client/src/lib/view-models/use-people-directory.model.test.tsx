import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { usersApi } from '../api/users.api';
import { personPhotoOf, setPeopleDirectory } from '../utils/people-directory.util';
import { usePeopleDirectoryModel } from './use-people-directory.model';

vi.mock('../api/users.api', () => ({ usersApi: { list: vi.fn() } }));

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

afterEach(() => setPeopleDirectory([]));

describe('usePeopleDirectoryModel', () => {
  // feliz
  it('fills the directory with the photo of whoever uses the system', async () => {
    vi.mocked(usersApi.list).mockResolvedValue({
      people: [
        {
          id: 'wq',
          name: 'Wellington Queiroz',
          email: 'wq@e.com',
          avatarUrl: 'https://cdn/wq.png',
        },
      ],
      isConnected: true,
    });

    renderHook(() => usePeopleDirectoryModel(), { wrapper });

    await waitFor(() =>
      expect(personPhotoOf({ name: 'Wellington Queiroz' })).toBe('https://cdn/wq.png'),
    );
  });

  // triste
  it('leaves the directory empty when the people list is down', async () => {
    vi.mocked(usersApi.list).mockRejectedValue(new Error('503'));

    renderHook(() => usePeopleDirectoryModel(), { wrapper });

    await waitFor(() => expect(usersApi.list).toHaveBeenCalled());
    expect(personPhotoOf({ name: 'Wellington Queiroz' })).toBeNull();
  });
});
