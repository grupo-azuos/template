import { type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useAppShellModel } from './use-app-shell.model';

/* A conta do Admin Console (foto do rodapé). Por padrão ela não responde: vale o que o sistema
   tiver, e os outros testes seguem olhando só o que este view-model decide. */
const accountMe = vi.hoisted(() => vi.fn());

vi.mock('../api/account-profile.api', () => ({ accountProfileApi: { me: accountMe } }));

function accountWrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

/* A rota atual entra pelo `useLocation`, e a saída pelo modelo de sessão: os dois são dublados
   para o teste olhar só o que este view-model decide. */
const pathname = vi.hoisted(() => ({ current: '/' }));
const signOut = vi.hoisted(() => vi.fn());

vi.mock('@tanstack/react-router', () => ({
  useLocation: () => ({ pathname: pathname.current }),
}));

vi.mock('./use-account-session.model', () => ({
  useAccountSessionModel: () => ({
    state: { isSigningOut: false, error: null },
    actions: { onSignOut: signOut },
  }),
}));

function renderAt(path: string) {
  pathname.current = path;

  return renderHook(() => useAppShellModel(), { wrapper: accountWrapper }).result.current;
}

beforeEach(() => {
  accountMe.mockReset().mockRejectedValue(new Error('offline'));
  pathname.current = '/';
  signOut.mockReset();
});

describe('useAppShellModel', () => {
  // feliz
  it('lights up the menu item of the screen the person is on', () => {
    expect(renderAt('/tasks/42').state.activeKey).toBe('tasks');
  });

  it('brings who is using the system, with the role already in Portuguese', () => {
    const model = renderAt('/tasks');

    expect(model.data.user.name).toBe('Usuário de desenvolvimento');
    expect(model.data.user.role).toBe('Administrador');
  });

  it('signs out through the account session', () => {
    renderAt('/tasks').actions.onSignOut();

    expect(signOut).toHaveBeenCalledOnce();
  });

  // triste
  it('lights nothing on a screen outside the menu', () => {
    expect(renderAt('/').state.activeKey).toBeUndefined();
  });

  // feliz
  /* O banco deste sistema não guarda foto; a do rodapé é a mesma do "Meu perfil", da conta. */
  it('shows the photo of the Admin Console account in the footer', async () => {
    accountMe.mockResolvedValue({
      name: 'Pessoa',
      email: 'pessoa@empresa.com.br',
      role: 'admin',
      profile: {
        avatarUrl: 'https://admin-console.grupoazuos.com.br/avatars/pessoa.png',
        jobTitle: null,
        department: null,
        phone: null,
        birthDate: null,
        bio: null,
      },
    });

    const { result } = renderHook(() => useAppShellModel(), { wrapper: accountWrapper });

    await waitFor(() => expect(result.current.data.user.avatarUrl).toBe('https://admin-console.grupoazuos.com.br/avatars/pessoa.png'));
  });

  // triste
  it('falls back to the initials when the account does not answer', async () => {
    const { result } = renderHook(() => useAppShellModel(), { wrapper: accountWrapper });

    await waitFor(() => expect(accountMe).toHaveBeenCalled());
    expect(result.current.data.user.avatarUrl ?? null).toBeNull();
  });
});
