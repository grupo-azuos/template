import type React from 'react';
import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router';
import { type Meta, type StoryObj } from '@storybook/react';
import { ListChecks } from 'lucide-react';

import { SidebarMenu, SidebarProvider } from '../ui/sidebar';
import { AzuosAppShellNavEntry } from './azuos-app-shell-nav-entry.component';

/**
 * O item precisa de DUAS coisas para desenhar: o contexto da barra lateral e um roteador. O `Link`
 * do TanStack resolve o endereço contra a árvore de rotas e, sem roteador por perto, a story morre
 * antes de pintar. Aqui a rota raiz É a própria story — igual ao `AzuosAppShell`, que tem o mesmo
 * problema. Não há navegação real; só o contexto que o `Link` precisa para não estourar fora do
 * app.
 */
function withShell(Story: () => React.JSX.Element) {
  const router = createRouter({
    routeTree: createRootRoute({
      component: () => (
        <SidebarProvider>
          <div className="bg-sidebar w-64 p-2">
            <SidebarMenu>
              <Story />
            </SidebarMenu>
          </div>
        </SidebarProvider>
      ),
    }),
    history: createMemoryHistory({ initialEntries: ['/'] }),
  });

  return <RouterProvider router={router} />;
}

const meta = {
  title: 'Navegação e estrutura/AzuosAppShellNavEntry',
  component: AzuosAppShellNavEntry,
  decorators: [withShell],
} satisfies Meta<typeof AzuosAppShellNavEntry>;

export default meta;

type Story = StoryObj<typeof meta>;

const ITEM = { key: 'tasks', label: 'Tarefas', to: '/tasks', icon: ListChecks };

export const Default: Story = {
  args: { data: { item: ITEM } },
};

/** Ativo: o ícone pulsa e o fundo nasce com fade, só na troca. */
export const Active: Story = {
  args: { data: { item: ITEM }, state: { isActive: true } },
};

/** Com contador: o selo usa o token de perigo, para acompanhar a troca de tema. */
export const WithBadge: Story = {
  args: { data: { item: ITEM, badge: 7 } },
};

/** Zero não vira selo: um "0" ao lado de cada item é ruído. */
export const BadgeZero: Story = {
  args: { data: { item: ITEM, badge: 0 } },
};
