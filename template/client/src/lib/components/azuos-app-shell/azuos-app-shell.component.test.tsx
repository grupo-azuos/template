import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BarChart3, LifeBuoy, ListChecks, Settings, Wrench } from 'lucide-react';
import { describe, expect, it, vi } from 'vitest';

import { AzuosAppShell, type AzuosAppShellProps } from './azuos-app-shell.component';

/**
 * `Link` exige um `RouterProvider` por perto. A resolução da rota é assíncrona, então as
 * consultas usam `findBy*`.
 */
function renderShell(overrides: Partial<Omit<AzuosAppShellProps, 'children'>> = {}) {
  const props: Omit<AzuosAppShellProps, 'children'> = {
    data: {
      user: { name: 'Ana Souza', role: 'Administrador' },
      areas: [],
      items,
      actions: [],
      profile: { to: '/profile' },
      ...overrides.data,
    },
    state: overrides.state,
    actions: { onSelectArea: vi.fn(), onSignOut: vi.fn(), ...overrides.actions },
  };
  const router = createRouter({
    routeTree: createRootRoute({
      component: () => (
        <AzuosAppShell {...props}>
          <div>Conteúdo da rota</div>
        </AzuosAppShell>
      ),
    }),
    history: createMemoryHistory({ initialEntries: ['/'] }),
  });

  render(<RouterProvider router={router} />);

  return props;
}

const items = [
  { key: 'tasks', label: 'Tarefas', to: '/tasks', icon: ListChecks },
  { key: 'reports', label: 'Relatórios', to: '/reports', icon: BarChart3 },
];

const areas = [
  { key: 'ops', label: 'Operação', icon: Wrench },
  { key: 'admin', label: 'Gestão', icon: Settings },
];

describe('AzuosAppShell', () => {
  // feliz
  it('draws the content, the menu items, the profile and the sign out', async () => {
    renderShell();

    expect(await screen.findByText('Conteúdo da rota')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Tarefas' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Relatórios' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Abrir meu perfil' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sair' })).toBeInTheDocument();
  });

  it('shows who is using the system in the footer', async () => {
    renderShell();

    expect(await screen.findByText('Ana Souza')).toBeInTheDocument();
    expect(screen.getByText('Administrador')).toBeInTheDocument();
  });

  it('draws the footer shortcuts above the profile', async () => {
    renderShell({
      data: {
        ...baseData(),
        actions: [{ key: 'support', label: 'Abrir chamado', icon: LifeBuoy, href: '/support', opensInNewTab: true }],
      },
    });

    const shortcut = await screen.findByRole('link', { name: 'Abrir chamado' });
    expect(shortcut).toHaveAttribute('target', '_blank');
    expect(shortcut).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('groups the shortcuts under a title at the end of the menu, not in the footer', async () => {
    renderShell({
      data: {
        ...baseData(),
        actions: [{ key: 'tv', label: 'Painel de TV', icon: LifeBuoy, href: '/tv', opensInNewTab: true }],
      },
    });

    const shortcuts = await screen.findByRole('list', { name: 'Atalhos' });
    expect(within(shortcuts).getByRole('link', { name: 'Painel de TV' })).toBeInTheDocument();
    expect(screen.getByText('Atalhos')).toBeInTheDocument();
  });

  it('signs out through the action', async () => {
    const props = renderShell();

    await userEvent.click(await screen.findByRole('button', { name: 'Sair' }));

    expect(props.actions.onSignOut).toHaveBeenCalledOnce();
  });

  it('draws the areas as an icon rail when there are two or more', async () => {
    const props = renderShell({ data: { ...baseData(), areas }, state: { activeArea: 'ops' } });

    const ops = await screen.findByRole('button', { name: 'Operação' });
    expect(ops).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Gestão' })).toHaveAttribute('aria-pressed', 'false');

    await userEvent.click(screen.getByRole('button', { name: 'Gestão' }));
    expect(props.actions.onSelectArea).toHaveBeenCalledWith('admin');
  });

  it('shows the badge when the counter comes through data', async () => {
    renderShell({ data: { ...baseData(), badges: { reports: 4 } } });

    expect(await screen.findByText('4')).toBeInTheDocument();
  });

  // triste
  it('does not draw the rail with a single area', async () => {
    renderShell({ data: { ...baseData(), areas: areas.slice(0, 1) } });

    await screen.findByText('Conteúdo da rota');
    expect(screen.queryByRole('button', { name: 'Operação' })).not.toBeInTheDocument();
  });

  it('draws no badge for a zero counter', async () => {
    renderShell({ data: { ...baseData(), badges: { reports: 0 } } });

    await screen.findByText('Conteúdo da rota');
    expect(screen.queryByText('0')).not.toBeInTheDocument();
  });

  it('blocks a second sign out while the first is running', async () => {
    renderShell({ state: { isSigningOut: true } });

    expect(await screen.findByRole('button', { name: 'Saindo…' })).toBeDisabled();
  });

  it('tells when the sign out failed', async () => {
    renderShell({ state: { signOutError: 'Não consegui encerrar a sessão. Tente novamente.' } });

    expect(await screen.findByRole('alert')).toHaveTextContent('Não consegui encerrar a sessão');
  });
});

function baseData(): AzuosAppShellProps['data'] {
  return {
    user: { name: 'Ana Souza', role: 'Administrador' },
    areas: [],
    items,
    actions: [],
    profile: { to: '/profile' },
  };
}
