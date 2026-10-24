import { afterEach, describe, expect, it, vi } from 'vitest';
import { accountOrigin, accountProfileUrl, signOutAccount } from './account-session.api';
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe('account session', () => {
  // feliz
  it('selects the account in the matching environment', () => {
    expect(accountOrigin('rh.grupoazuos.com.br', '')).toBe(
      'https://admin-console.grupoazuos.com.br',
    );
    expect(accountOrigin('rh.homo.grupoazuos.com.br', '')).toBe(
      'https://admin-console.homo.grupoazuos.com.br',
    );
    expect(accountOrigin('localhost', '')).toBe('http://localhost:5000');
    expect(accountOrigin('rh.local.test', 'https://account.local.test/')).toBe(
      'https://account.local.test',
    );
  });
  it('asks the identity provider to revoke the session using JSON and credentials', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal('fetch', fetchMock);
    await signOutAccount();
    const [url, options] = fetchMock.mock.calls[0]!;
    expect(new URL(url).pathname).toBe('/api/auth/logout');
    expect(options).toMatchObject({
      method: 'POST',
      credentials: 'include',
      body: '{}',
      redirect: 'error',
      headers: { 'content-type': 'application/json' },
    });
  });
  // triste
  it('never guesses an identity provider for an unknown domain', () => {
    expect(() => accountOrigin('unrelated.test', '')).toThrow(/não foi configurado/);
  });
  it('does not pretend logout succeeded when the provider refuses it', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }));
    await expect(signOutAccount()).rejects.toThrow(/encerrar a sessão/);
  });
  it('propagates a connection failure', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Offline')));
    await expect(signOutAccount()).rejects.toThrow('Offline');
  });
});

describe('account profile destination', () => {
  // feliz
  it.each([
    ['localhost', 'http://localhost:5000/profile'],
    ['127.0.0.1', 'http://localhost:5000/profile'],
    ['certmonitor.homo.grupoazuos.com.br', 'https://admin-console.homo.grupoazuos.com.br/profile'],
    ['certmonitor.grupoazuos.com.br', 'https://admin-console.grupoazuos.com.br/profile'],
  ])('uses the same destination as RH for %s', (hostname, expected) => {
    vi.stubGlobal('window', { location: { hostname } });
    vi.stubEnv('VITE_ACCOUNT_URL', '');

    expect(accountProfileUrl()).toBe(expected);
  });

  it('uses the configured origin for a custom domain or local port', () => {
    vi.stubGlobal('window', { location: { hostname: 'localhost' } });
    vi.stubEnv('VITE_ACCOUNT_URL', 'http://localhost:5100/');

    expect(accountProfileUrl()).toBe('http://localhost:5100/profile');
  });

  // triste
  it.each([
    ['unrelated.test', ''],
    ['grupoazuos.com.br.unrelated.test', ''],
    ['localhost', 'invalid-url'],
  ])('offers no destination for %s with configuration %s', (hostname, configured) => {
    vi.stubGlobal('window', { location: { hostname } });
    vi.stubEnv('VITE_ACCOUNT_URL', configured);

    expect(accountProfileUrl()).toBeNull();
  });
});
