import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BarChart3, CalendarRange, ListChecks, Settings, Users, Wrench } from 'lucide-react';
import { describe, expect, it, vi } from 'vitest';

import {
  AzuosAppShellMobileBar,
  type AzuosAppShellMobileBarProps,
} from './azuos-app-shell-mobile-bar.component';

const items = [
  { key: 'tasks', label: 'Tarefas', to: '/tasks', icon: ListChecks },
  { key: 'schedule', label: 'Cronograma', to: '/schedule', icon: CalendarRange },
  { key: 'reports', label: 'Relatórios', to: '/reports', icon: BarChart3 },
  { key: 'team', label: 'Equipe', to: '/team', icon: Users },
];

function renderBar(overrides: Partial<AzuosAppShellMobileBarProps> = {}) {
  const props: AzuosAppShellMobileBarProps = {
    data: {
      user: { name: 'Ana Souza', role: 'Administradora' },
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
    routeTree: createRootRoute({ component: () => <AzuosAppShellMobileBar {...props} /> }),
    history: createMemoryHistory({ initialEntries: ['/'] }),
  });

  render(<RouterProvider router={router} />);

  return props;
}

describe('AzuosAppShellMobileBar', () => {
  // feliz
  it('shows three items and the menu button in the bottom bar', async () => {
    renderBar({ state: { activeKey: 'tasks' } });

    const bar = await screen.findByRole('navigation', { name: 'Menu principal' });
    expect(within(bar).getAllByRole('link')).toHaveLength(3);
    expect(within(bar).queryByRole('link', { name: 'Equipe' })).not.toBeInTheDocument();
    expect(within(bar).getByRole('button', { name: 'Abrir o menu' })).toBeInTheDocument();
  });

  it('opens the whole menu in the bottom sheet, with profile and sign out', async () => {
    const props = renderBar();

    await userEvent.click(await screen.findByRole('button', { name: 'Abrir o menu' }));
    const sheet = await screen.findByRole('dialog');

    expect(within(sheet).getByRole('link', { name: 'Equipe' })).toBeInTheDocument();
    expect(within(sheet).getByRole('link', { name: 'Abrir meu perfil' })).toBeInTheDocument();
    await userEvent.click(within(sheet).getByRole('button', { name: 'Sair' }));
    expect(props.actions.onSignOut).toHaveBeenCalledOnce();
  });

  it('switches area inside the sheet', async () => {
    const props = renderBar({
      data: {
        user: { name: 'Ana Souza', role: 'Administradora' },
        items,
        actions: [],
        profile: { to: '/profile' },
        areas: [
          { key: 'ops', label: 'Operação', icon: Wrench },
          { key: 'admin', label: 'Gestão', icon: Settings },
        ],
      },
      state: { activeArea: 'ops', isMenuOpen: true },
    });

    const sheet = await screen.findByRole('dialog');
    await userEvent.click(within(sheet).getByRole('button', { name: 'Gestão' }));

    expect(props.actions.onSelectArea).toHaveBeenCalledWith('admin');
  });

  // triste
  it('lights the menu button when the open screen is not in the bar', async () => {
    renderBar({ state: { activeKey: 'team' } });

    expect(await screen.findByRole('button', { name: 'Abrir o menu' })).toHaveAttribute(
      'data-active',
      'true',
    );
  });

  it('does not draw the area switch with a single area', async () => {
    renderBar({
      data: {
        user: { name: 'Ana Souza', role: 'Administradora' },
        items,
        actions: [],
        profile: { to: '/profile' },
        areas: [{ key: 'ops', label: 'Operação', icon: Wrench }],
      },
      state: { isMenuOpen: true },
    });

    const sheet = await screen.findByRole('dialog');
    expect(within(sheet).queryByRole('group', { name: 'Partes do sistema' })).not.toBeInTheDocument();
  });

  // feliz
  /* Padrão do Android (Compose): a gaveta tem a "linguinha" e não tem o X de fechar. */
  it('draws the sheet with the drag handle and without a close button', async () => {
    renderBar({ state: { isMenuOpen: true } });

    const sheet = await screen.findByRole('dialog');
    expect(sheet.querySelector('[data-slot="sheet-drag-handle"]')).toBeInTheDocument();
    expect(within(sheet).queryByRole('button', { name: 'Close' })).not.toBeInTheDocument();
  });

  it('closes the sheet when the handle is dragged down', async () => {
    renderBar({ state: { isMenuOpen: true } });

    const sheet = await screen.findByRole('dialog');
    const handle = sheet.querySelector('[data-slot="sheet-drag-handle"]')!;
    fireEvent.pointerDown(handle, { clientY: 100, pointerId: 1 });
    fireEvent.pointerMove(handle, { clientY: 260, pointerId: 1 });
    fireEvent.pointerUp(handle, { clientY: 260, pointerId: 1 });

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  // triste
  it('keeps the sheet open after a short drag', async () => {
    renderBar({ state: { isMenuOpen: true } });

    const sheet = await screen.findByRole('dialog');
    const handle = sheet.querySelector('[data-slot="sheet-drag-handle"]')!;
    fireEvent.pointerDown(handle, { clientY: 100, pointerId: 1 });
    fireEvent.pointerUp(handle, { clientY: 116, pointerId: 1 });

    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
});
