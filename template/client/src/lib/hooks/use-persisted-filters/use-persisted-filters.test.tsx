import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { MOCK_SESSION_USER, mockAuth } from '../../auth/mock-user';
import { filterStorageKey } from '../../utils/filter-storage.util';
import { usePersistedFilters } from './use-persisted-filters';

type Filters = { search: string; status: 'open' | 'all' };

const DEFAULTS: Filters = { search: '', status: 'open' };
const USER_A = '7c9e6679-7425-40de-944b-e07fc1f90ae7';
const USER_B = '0b3f1c2e-5a4d-4e8b-9c1a-2d3e4f5a6b7c';

function parse(raw: unknown): Filters | null {
  if (typeof raw !== 'object' || raw === null) return null;

  const { search, status } = raw as Partial<Filters>;

  if (typeof search !== 'string') return null;

  return { search, status: status === 'all' ? 'all' : 'open' };
}

/** Quem está logado durante o teste: a sessão do sistema passa a devolver esta pessoa. */
function wrapperFor(userId: string, email = 'a@azuoscontabil.com.br') {
  vi.spyOn(mockAuth, 'getUser').mockReturnValue({ ...MOCK_SESSION_USER, id: userId, email });

  return undefined;
}

function hookFor(
  screen: string,
  extra: Partial<Parameters<typeof usePersistedFilters<Filters>>[0]> = {},
) {
  return () => usePersistedFilters<Filters>({ screen, defaults: DEFAULTS, parse, ...extra });
}

describe('usePersistedFilters', () => {
  it('uses the restored user filters as the base for functional updates after an identity change', () => {
    window.localStorage.clear();
    const second = renderHook(hookFor('companies', { userId: USER_B }));
    act(() => second.result.current.setFilters({ search: 'user B', status: 'all' }));
    second.unmount();

    const { result, rerender } = renderHook(
      ({ userId }) =>
        usePersistedFilters({ screen: 'companies', defaults: DEFAULTS, parse, userId }),
      { initialProps: { userId: USER_A } },
    );
    rerender({ userId: USER_B });
    act(() => result.current.setFilters((previous) => ({ ...previous, search: 'updated B' })));

    expect(result.current.filters).toEqual({ search: 'updated B', status: 'all' });
  });

  it('sanitizes URL overrides even without a saved preference', () => {
    const { result } = renderHook(
      hookFor('companies', {
        userId: USER_A,
        override: { status: 'all' },
        sanitize: (filters) => ({ ...filters, status: 'open' }),
      }),
    );

    expect(result.current.filters.status).toBe('open');
  });

  beforeEach(() => {
    window.localStorage.clear();
    vi.restoreAllMocks();
  });

  it('opens with the default when nothing is saved', () => {
    const { result } = renderHook(hookFor('companies'), { wrapper: wrapperFor(USER_A) });

    expect(result.current.filters).toEqual(DEFAULTS);
  });

  it('restores the saved filter on the FIRST render, before any query', () => {
    const first = renderHook(hookFor('companies'), { wrapper: wrapperFor(USER_A) });
    act(() => first.result.current.setFilters({ search: 'abc', status: 'all' }));
    first.unmount();

    /* Um novo mount é o F5: o valor tem de estar no PRIMEIRO render, sem efeito no meio. */
    const renders: Filters[] = [];
    renderHook(
      () => {
        const hook = hookFor('companies')();
        renders.push(hook.filters);

        return hook;
      },
      { wrapper: wrapperFor(USER_A) },
    );

    expect(renders[0]).toEqual({ search: 'abc', status: 'all' });
  });

  it('accepts a function of the previous value, like setState', () => {
    const { result } = renderHook(hookFor('companies'), { wrapper: wrapperFor(USER_A) });

    act(() => result.current.setFilters((previous) => ({ ...previous, search: 'x' })));
    act(() => result.current.setFilters((previous) => ({ ...previous, status: 'all' })));

    expect(result.current.filters).toEqual({ search: 'x', status: 'all' });
  });

  it('isolates by screen', () => {
    const a = renderHook(hookFor('companies'), { wrapper: wrapperFor(USER_A) });
    act(() => a.result.current.setFilters({ search: 'só aqui', status: 'all' }));

    const other = renderHook(hookFor('history'), { wrapper: wrapperFor(USER_A) });

    expect(other.result.current.filters).toEqual(DEFAULTS);
  });

  it('isolates by user', () => {
    const a = renderHook(hookFor('companies'), { wrapper: wrapperFor(USER_A) });
    act(() => a.result.current.setFilters({ search: 'da pessoa A', status: 'all' }));

    const b = renderHook(hookFor('companies'), { wrapper: wrapperFor(USER_B) });

    expect(b.result.current.filters).toEqual(DEFAULTS);
  });

  it('keys by UUID: changing the same account e-mail keeps the filter', () => {
    const before = renderHook(hookFor('companies'), {
      wrapper: wrapperFor(USER_A, 'antigo@azuoscontabil.com.br'),
    });
    act(() => before.result.current.setFilters({ search: 'fica', status: 'all' }));
    before.unmount();

    const after = renderHook(hookFor('companies'), {
      wrapper: wrapperFor(USER_A, 'novo@azuoscontabil.com.br'),
    });

    expect(after.result.current.filters.search).toBe('fica');
    expect(filterStorageKey(USER_A)).not.toContain('@');
  });

  it('clears the preference and restores the default on "limpar" — even after F5', () => {
    const first = renderHook(hookFor('companies'), { wrapper: wrapperFor(USER_A) });
    act(() => first.result.current.setFilters({ search: 'abc', status: 'all' }));
    act(() => first.result.current.clearFilters());

    expect(first.result.current.filters).toEqual(DEFAULTS);
    first.unmount();

    const second = renderHook(hookFor('companies'), { wrapper: wrapperFor(USER_A) });

    expect(second.result.current.filters).toEqual(DEFAULTS);
  });

  it('does not clear other screens when clearing one', () => {
    const companies = renderHook(hookFor('companies'), { wrapper: wrapperFor(USER_A) });
    const history = renderHook(hookFor('history'), { wrapper: wrapperFor(USER_A) });
    act(() => companies.result.current.setFilters({ search: 'c', status: 'all' }));
    act(() => history.result.current.setFilters({ search: 'h', status: 'all' }));

    act(() => companies.result.current.clearFilters());
    history.unmount();

    const again = renderHook(hookFor('history'), { wrapper: wrapperFor(USER_A) });

    expect(again.result.current.filters.search).toBe('h');
  });

  it.each([
    ['JSON quebrado', '{não é json'],
    ['versão antiga', JSON.stringify({ version: 0, screens: { companies: { search: 'x' } } })],
    ['formato errado', JSON.stringify(['lixo'])],
    ['tela inválida', JSON.stringify({ version: 1, screens: { companies: 42 } })],
  ])('com %s salvo, abre no padrão e continua utilizável', (_name, raw) => {
    window.localStorage.setItem(filterStorageKey(USER_A), raw);

    const { result } = renderHook(hookFor('companies'), { wrapper: wrapperFor(USER_A) });

    expect(result.current.filters).toEqual(DEFAULTS);

    act(() => result.current.setFilters({ search: 'novo', status: 'all' }));

    expect(result.current.filters.search).toBe('novo');
  });

  it('keeps the screen working and the filter in session without storage', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('SecurityError');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });

    const { result } = renderHook(hookFor('companies'), { wrapper: wrapperFor(USER_A) });

    expect(result.current.filters).toEqual(DEFAULTS);

    act(() => result.current.setFilters({ search: 'só em memória', status: 'all' }));

    expect(result.current.filters.search).toBe('só em memória');
  });

  it('lets an explicit outside filter (URL) beat the saved one; the rest follows the saved', () => {
    const saved = renderHook(hookFor('companies'), { wrapper: wrapperFor(USER_A) });
    act(() => saved.result.current.setFilters({ search: 'salvo', status: 'all' }));
    saved.unmount();

    const { result } = renderHook(hookFor('companies', { override: { search: 'da url' } }), {
      wrapper: wrapperFor(USER_A),
    });

    expect(result.current.filters).toEqual({ search: 'da url', status: 'all' });
  });

  it('sanitizes the saved filter by TODAY permissions', () => {
    const saved = renderHook(hookFor('companies'), { wrapper: wrapperFor(USER_A) });
    act(() => saved.result.current.setFilters({ search: 'x', status: 'all' }));
    saved.unmount();

    const { result } = renderHook(
      hookFor('companies', { sanitize: (filters) => ({ ...filters, status: 'open' }) }),
      { wrapper: wrapperFor(USER_A) },
    );

    expect(result.current.filters).toEqual({ search: 'x', status: 'open' });
  });
});
