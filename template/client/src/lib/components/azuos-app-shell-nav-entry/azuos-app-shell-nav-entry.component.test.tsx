import { createRootRoute, createRouter, RouterProvider } from '@tanstack/react-router';
import { render, screen } from '@testing-library/react';
import { ListChecks } from 'lucide-react';
import { describe, expect, it } from 'vitest';

import { SidebarMenu, SidebarProvider } from '../ui/sidebar';
import {
  AzuosAppShellNavEntry,
  type AzuosAppShellNavEntryProps,
} from './azuos-app-shell-nav-entry.component';

const ITEM = { key: 'tasks', label: 'Tarefas', to: '/tasks', icon: ListChecks };

/**
 * O item usa o `Link` do TanStack, que exige um roteador em volta para resolver o endereço. Um
 * roteador mínimo com uma rota raiz basta: o que está sob teste é o item, não a navegação.
 */
function renderEntry(props: AzuosAppShellNavEntryProps) {
  const rootRoute = createRootRoute({
    component: () => (
      <SidebarProvider>
        <SidebarMenu>
          <AzuosAppShellNavEntry {...props} />
        </SidebarMenu>
      </SidebarProvider>
    ),
  });

  const router = createRouter({ routeTree: rootRoute });

  return render(<RouterProvider router={router} />);
}

describe('AzuosAppShellNavEntry', () => {
  // feliz
  it('draws a real link to the screen it points at', async () => {
    renderEntry({ data: { item: ITEM } });

    expect(await screen.findByRole('link', { name: 'Tarefas' })).toHaveAttribute('href', '/tasks');
  });

  it('marks the active item, so the menu says where the person is', async () => {
    renderEntry({ data: { item: ITEM }, state: { isActive: true } });

    expect(await screen.findByRole('link', { name: 'Tarefas' })).toHaveAttribute(
      'data-active',
      'true',
    );
  });

  it('shows the counter when there is one', async () => {
    renderEntry({ data: { item: ITEM, badge: 7 } });

    expect(await screen.findByText('7')).toBeInTheDocument();
  });

  // triste
  /* Zero não vira selo: um "0" ao lado de cada item do menu é ruído, e ruído em todo item faz a
     pessoa parar de olhar o selo que importa. */
  it('draws no badge for zero', async () => {
    renderEntry({ data: { item: ITEM, badge: 0 } });

    await screen.findByRole('link', { name: 'Tarefas' });

    expect(screen.queryByText('0')).not.toBeInTheDocument();
  });

  /* O tamanho vai como `text-[1rem]`: a paleta tem um token de cor chamado `base`, então
     `text-base` seria lido como COR e o menu sairia quase branco sobre a barra clara. */
  it('does not use text-base, which the palette turns into a colour', async () => {
    renderEntry({ data: { item: ITEM } });

    const link = await screen.findByRole('link', { name: 'Tarefas' });

    expect(link.className).toContain('text-[1rem]');
    expect(link.className).not.toMatch(/\btext-base\b/);
  });
});
