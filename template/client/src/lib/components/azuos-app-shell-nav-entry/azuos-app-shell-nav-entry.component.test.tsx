import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router';
import { render, screen } from '@testing-library/react';
import { ListChecks } from 'lucide-react';
import { describe, expect, it } from 'vitest';

import { SidebarMenu, SidebarProvider } from '../ui/sidebar';
import {
  AzuosAppShellNavEntry,
  type AzuosAppShellNavEntryProps,
} from './azuos-app-shell-nav-entry.component';

const item = { key: 'tasks', label: 'Tarefas', to: '/tasks', icon: ListChecks };

function renderEntry(props: AzuosAppShellNavEntryProps) {
  const router = createRouter({
    routeTree: createRootRoute({
      component: () => (
        <SidebarProvider>
          <SidebarMenu>
            <AzuosAppShellNavEntry {...props} />
          </SidebarMenu>
        </SidebarProvider>
      ),
    }),
    history: createMemoryHistory({ initialEntries: ['/'] }),
  });

  render(<RouterProvider router={router} />);
}

describe('AzuosAppShellNavEntry', () => {
  // feliz
  it('links to the route with icon and label', async () => {
    renderEntry({ data: { item } });

    expect(await screen.findByRole('link', { name: 'Tarefas' })).toHaveAttribute('href', '/tasks');
  });

  it('marks the active item as the current page', async () => {
    renderEntry({ data: { item }, state: { isActive: true } });

    expect(await screen.findByRole('link', { name: 'Tarefas' })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  it('shows the badge', async () => {
    renderEntry({ data: { item, badge: 7 } });

    expect(await screen.findByText('7')).toBeInTheDocument();
  });

  // triste
  it('draws no badge for zero', async () => {
    renderEntry({ data: { item, badge: 0 } });

    await screen.findByRole('link', { name: 'Tarefas' });
    expect(screen.queryByText('0')).not.toBeInTheDocument();
  });

  it('is not the current page when inactive', async () => {
    renderEntry({ data: { item } });

    expect(await screen.findByRole('link', { name: 'Tarefas' })).not.toHaveAttribute('aria-current');
  });
});
