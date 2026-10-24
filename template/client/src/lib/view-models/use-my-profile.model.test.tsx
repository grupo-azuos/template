import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { type ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { accountProfileApi } from '../api/account-profile.api';
import { accountProfileUrl } from '../api/account-session.api';
import { useTheme } from '../theme/theme';
import {
  type MyProfileSource,
  mergePerson,
  toBirthDateLabel,
  useMyProfileModel,
} from './use-my-profile.model';

vi.mock('../api/account-session.api', () => ({ accountProfileUrl: vi.fn() }));
vi.mock('../api/account-profile.api', () => ({
  accountProfileApi: { me: vi.fn(), systems: vi.fn() },
}));
vi.mock('../theme/theme', () => ({ useTheme: vi.fn() }));

const onToggle = vi.fn();
const local = {
  name: 'Ana (local)',
  email: 'ana@grupoazuos.com.br',
  roleLabel: 'Gestor',
  avatarUrl: null,
  jobTitle: null,
  department: null,
};
const account = {
  name: 'Ana Souza',
  email: 'ana@grupoazuos.com.br',
  role: 'admin' as const,
  profile: {
    avatarUrl: 'https://admin-console.test/api/users/1/avatar',
    jobTitle: 'Analista',
    department: 'Fiscal',
    phone: '11912345678',
    birthDate: '1990-03-25',
    bio: 'Gosto de planilhas.',
  },
};
const systems = [
  { name: 'Paralegal', presentation: { url: 'https://paralegal.test' }, access: { role: 'user' as const } },
];

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

function setup(source: Partial<MyProfileSource> = {}) {
  return renderHook(
    () => useMyProfileModel({ person: local, isLoading: false, error: null, ...source }),
    { wrapper },
  );
}

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(useTheme).mockReturnValue({ theme: 'light', actions: { onToggle } });
  vi.mocked(accountProfileUrl).mockReturnValue('https://admin-console.test/profile');
});

describe('useMyProfileModel', () => {
  // feliz
  it('fills the profile from the account, keeping the role of this system', async () => {
    vi.mocked(accountProfileApi.me).mockResolvedValue(account);
    vi.mocked(accountProfileApi.systems).mockResolvedValue(systems);

    const { result } = setup();
    await waitFor(() => expect(result.current.data.person?.systems).toBeDefined());

    expect(result.current.data.person).toEqual({
      name: 'Ana Souza',
      email: 'ana@grupoazuos.com.br',
      roleLabel: 'Gestor',
      avatarUrl: 'https://admin-console.test/api/users/1/avatar',
      jobTitle: 'Analista',
      department: 'Fiscal',
      phone: '11912345678',
      birthDateLabel: '25/03/1990',
      bio: 'Gosto de planilhas.',
      systems: [{ name: 'Paralegal', url: 'https://paralegal.test', roleLabel: 'Usuário' }],
    });
    expect(result.current.data.accountUrl).toBe('https://admin-console.test/profile');
  });

  it('toggles the theme', () => {
    vi.mocked(accountProfileApi.me).mockReturnValue(new Promise(() => {}));
    vi.mocked(accountProfileApi.systems).mockReturnValue(new Promise(() => {}));

    const { result } = setup();
    result.current.actions.onToggleTheme();

    expect(onToggle).toHaveBeenCalledOnce();
  });

  // triste
  it('falls back to what the system knows when the account does not answer', async () => {
    vi.mocked(accountProfileApi.me).mockRejectedValue(new Error('sem sessão'));
    vi.mocked(accountProfileApi.systems).mockRejectedValue(new Error('sem sessão'));

    const { result } = setup();
    await waitFor(() => expect(result.current.state.isLoading).toBe(false));

    expect(result.current.data.person).toMatchObject({ name: 'Ana (local)', roleLabel: 'Gestor' });
    expect(result.current.data.person?.systems).toBeUndefined();
    expect(result.current.state.error).toBeNull();
  });

  it('reports the failure when nobody knows who the person is', async () => {
    vi.mocked(accountProfileApi.me).mockRejectedValue(new Error('sem sessão'));
    vi.mocked(accountProfileApi.systems).mockRejectedValue(new Error('sem sessão'));

    const { result } = setup({ person: null });
    await waitFor(() => expect(result.current.state.isLoading).toBe(false));

    expect(result.current.data.person).toBeNull();
    expect(result.current.state.error).toBeTruthy();
  });
});

describe('mergePerson', () => {
  it('uses the account role when the system does not know one', () => {
    expect(mergePerson(null, account, undefined)?.roleLabel).toBe('Administrador');
  });

  it('has nobody without either source', () => {
    expect(mergePerson(null, undefined, undefined)).toBeNull();
  });
});

describe('toBirthDateLabel', () => {
  it('writes the day the Brazilian way', () => {
    expect(toBirthDateLabel('1990-03-25')).toBe('25/03/1990');
  });

  it('ignores an empty or malformed date', () => {
    expect(toBirthDateLabel(null)).toBeNull();
    expect(toBirthDateLabel('25/03/1990')).toBeNull();
  });
});
