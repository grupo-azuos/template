import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router';
import { act, render, screen, waitFor } from '@testing-library/react';
import { BarChart3, ListChecks, Settings, Wrench } from 'lucide-react';
import { useEffect } from 'react';
import { describe, expect, it } from 'vitest';

import { type AppShellNavigation } from '../navigation/app-shell-navigation';
import { useAppShellNavigationModel } from './use-app-shell-navigation.model';

const config: AppShellNavigation = {
  areas: [
    { key: 'ops', label: 'Operação', icon: Wrench },
    { key: 'admin', label: 'Gestão', icon: Settings, isAdminOnly: true },
  ],
  items: [
    { key: 'tasks', label: 'Tarefas', to: '/tasks', icon: ListChecks, area: 'ops' },
    { key: 'reports', label: 'Relatórios', to: '/reports', icon: BarChart3, area: 'admin' },
  ],
  actions: [],
  profile: { to: '/profile' },
};

type Model = ReturnType<typeof useAppShellNavigationModel>;

/* O hook entrega o resultado por um efeito: o teste lê o último valor, e a renderização não
   mexe em nada de fora dela. */
const seen: { model?: Model } = {};

function remember(model: Model) {
  seen.model = model;
}

function Probe({ config: probeConfig, isAdmin }: { config: AppShellNavigation; isAdmin: boolean }) {
  const current = useAppShellNavigationModel(probeConfig, { isAdmin });

  useEffect(() => remember(current));

  return <div>{current.state.activeArea ?? 'ready'}</div>;
}

async function renderAt(path: string, isAdmin = true, probeConfig: AppShellNavigation = config) {
  const router = createRouter({
    routeTree: createRootRoute({
      component: function ProbeRoute() {
        return <Probe config={probeConfig} isAdmin={isAdmin} />;
      },
    }),
    history: createMemoryHistory({ initialEntries: [path] }),
  });
  render(<RouterProvider router={router} />);
  await screen.findByText(/ops|admin|ready/);

  return router;
}

describe('useAppShellNavigationModel', () => {
  // feliz
  it('lights the item and the area of the open route', async () => {
    await renderAt('/tasks/9');

    expect(seen.model?.state.activeKey).toBe('tasks');
    expect(seen.model?.state.activeArea).toBe('ops');
    expect(seen.model?.data.items.map((item) => item.key)).toEqual(['tasks']);
  });

  it('switches the list without navigating', async () => {
    await renderAt('/tasks');

    act(() => seen.model?.actions.onSelectArea('admin'));

    expect(await screen.findByText('admin')).toBeInTheDocument();
    expect(seen.model?.data.items.map((item) => item.key)).toEqual(['reports']);
    expect(seen.model?.state.activeKey).toBe('tasks');
  });

  it('goes back to the area of the route after navigating', async () => {
    const router = await renderAt('/tasks');

    act(() => seen.model?.actions.onSelectArea('admin'));
    act(() => router.history.push('/reports'));
    await waitFor(() => expect(seen.model?.state.activeKey).toBe('reports'));
    act(() => router.history.push('/tasks'));

    await waitFor(() => expect(seen.model?.state.activeArea).toBe('ops'));
  });

  // triste
  it('hides admin-only areas from everyone else', async () => {
    await renderAt('/tasks', false);

    expect(seen.model?.data.areas.map((area) => area.key)).toEqual(['ops']);
  });

  it('falls back to the account profile without a profile screen', async () => {
    const withoutProfile = { areas: config.areas, items: config.items, actions: config.actions };
    await renderAt('/tasks', false, withoutProfile);

    expect(seen.model?.data.profile).toEqual({ href: 'http://localhost:5000/profile' });
  });
});
