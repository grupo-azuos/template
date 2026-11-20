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

function withShell(Story: () => React.JSX.Element) {
  const router = createRouter({
    routeTree: createRootRoute({
      component: () => (
        <SidebarProvider>
          <div className="w-64 bg-sidebar p-2 text-sidebar-foreground">
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
  args: { data: { item: { key: 'tasks', label: 'Tarefas', to: '/tasks', icon: ListChecks } } },
} satisfies Meta<typeof AzuosAppShellNavEntry>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Active: Story = { args: { state: { isActive: true } } };

export const WithBadge: Story = {
  args: { data: { ...meta.args.data, badge: 3 } },
};
