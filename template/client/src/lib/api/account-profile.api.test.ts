import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { accountProfileApi } from './account-profile.api';

vi.mock('./account-session.api', () => ({ accountOrigin: () => 'https://admin-console.test' }));

const fetchMock = vi.fn();

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
  fetchMock.mockReset();
});

describe('accountProfileApi', () => {
  // feliz
  it('reads the signed-in profile from the admin console with the session cookie', async () => {
    const user = { name: 'Ana' };
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ data: { user } }), { status: 200 }));

    await expect(accountProfileApi.me()).resolves.toEqual(user);

    const [url, init] = fetchMock.mock.calls[0] as [URL, RequestInit];
    expect(url.href).toBe('https://admin-console.test/api/me/profile');
    expect(init.credentials).toBe('include');
    expect(init.method ?? 'GET').toBe('GET');
  });

  it('reads the systems the person opens', async () => {
    const systems = [{ name: 'Paralegal' }];
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ data: { systems } }), { status: 200 }));

    await expect(accountProfileApi.systems()).resolves.toEqual(systems);
    expect((fetchMock.mock.calls[0] as [URL])[0].href).toBe('https://admin-console.test/api/me/systems');
  });

  // triste
  it('fails clearly when the admin console refuses', async () => {
    fetchMock.mockResolvedValue(new Response('{}', { status: 401 }));

    await expect(accountProfileApi.me()).rejects.toThrow('admin-console');
  });
});
