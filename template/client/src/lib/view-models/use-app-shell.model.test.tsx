import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useAppShellModel } from './use-app-shell.model';

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

  return renderHook(() => useAppShellModel()).result.current;
}

beforeEach(() => {
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
});
