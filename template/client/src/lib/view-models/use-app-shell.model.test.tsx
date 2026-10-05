import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useAppShellModel } from './use-app-shell.model';

/**
 * O view-model lê a rota atual pelo `useLocation` do TanStack. Montar o roteador inteiro só para
 * saber o caminho seria testar o roteador, não o view-model — então o `useLocation` é dublado e o
 * teste controla o `pathname`, que é a única coisa que entra na decisão.
 */
const pathname = vi.hoisted(() => ({ current: '/' }));

vi.mock('@tanstack/react-router', () => ({
  useLocation: () => ({ pathname: pathname.current }),
}));

function renderAt(path: string) {
  pathname.current = path;

  return renderHook(() => useAppShellModel()).result.current;
}

beforeEach(() => {
  pathname.current = '/';
});

describe('useAppShellModel', () => {
  // feliz
  /* Qual item está aceso é decidido AQUI, e não no compositor: resolver a rota atual é trabalho de
     view-model, e é o que mantém o `AzuosAppShell` sem saber que existe roteamento. */
  it('lights up the menu item of the screen the person is on', () => {
    expect(renderAt('/tasks').state.activeKey).toBe('tasks');
  });

  it('keeps the item lit on a subroute, so the menu does not go dark inside a record', () => {
    expect(renderAt('/tasks/42').state.activeKey).toBe('tasks');
  });

  it('brings who is using the system, with the role already in Portuguese', () => {
    const model = renderAt('/tasks');

    expect(model.data.user.name).not.toBe('');
    expect(model.data.user.email).toContain('@');
    /* O papel chega TRADUZIDO: a chave do contrato é inglês, e quem vê a tela lê português. */
    expect(model.data.user.role).not.toMatch(/^[a-z_]+$/);
  });

  // triste
  /* Rota que não está no menu acontece na raiz e numa tela ainda não cadastrada. Acender o primeiro
     item seria mentir sobre onde a pessoa está — pior que não acender nenhum. */
  it('lights up nothing when the screen is not in the menu', () => {
    expect(renderAt('/').state.activeKey).toBeUndefined();
    expect(renderAt('/relatorios').state.activeKey).toBeUndefined();
  });

  /* Um caminho que só COMEÇA igual não conta: `/tasksomething` não é uma subrota de `/tasks`. */
  it('does not confuse a path that merely starts the same', () => {
    expect(renderAt('/tasksomething').state.activeKey).toBeUndefined();
  });

  /* Contador de menu ainda não existe neste template. Vazio, e não ausente: o compositor faz
     `badges[key]` sem checar, e um `undefined` ali derrubaria a casca inteira. */
  it('starts with an empty badge map, never undefined', () => {
    expect(renderAt('/tasks').data.badges).toEqual({});
  });
});
