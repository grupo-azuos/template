import type React from 'react';
import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router';
import { type Meta, type StoryObj } from '@storybook/react';
import {
  BarChart3,
  CalendarRange,
  LayoutGrid,
  LifeBuoy,
  ListChecks,
  SlidersHorizontal,
  Users,
} from 'lucide-react';
import { fn } from 'storybook/test';

import { AzuosAppShellMobileBar } from './azuos-app-shell-mobile-bar.component';

function withRouter(Story: () => React.JSX.Element) {
  const router = createRouter({
    routeTree: createRootRoute({ component: Story }),
    history: createMemoryHistory({ initialEntries: ['/tasks'] }),
  });

  return <RouterProvider router={router} />;
}

const meta = {
  title: 'Navegação e estrutura/AzuosAppShellMobileBar',
  component: AzuosAppShellMobileBar,
  decorators: [withRouter],
  parameters: { layout: 'fullscreen' },
  globals: { viewport: { value: 'mobile1', isRotated: false } },
  args: {
    data: {
      user: { name: 'Ana Souza', role: 'Administradora' },
      areas: [],
      items: [
        { key: 'tasks', label: 'Tarefas', to: '/tasks', icon: ListChecks, area: 'operation' },
        { key: 'schedule', label: 'Cronograma', to: '/schedule', icon: CalendarRange, area: 'operation' },
        { key: 'reports', label: 'Relatórios', to: '/reports', icon: BarChart3, area: 'operation' },
        { key: 'team', label: 'Equipe', to: '/team', icon: Users, area: 'operation' },
      ],
      actions: [{ key: 'support', label: 'Abrir chamado', icon: LifeBuoy, href: '/support' }],
      profile: { to: '/profile' },
      badges: { schedule: 3 },
    },
    state: { activeKey: 'tasks' },
    actions: { onSelectArea: fn(), onSignOut: fn() },
  },
} satisfies Meta<typeof AzuosAppShellMobileBar>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** O ☰ aberto: o menu inteiro na gaveta de baixo. */
export const MenuOpen: Story = {
  args: { state: { activeKey: 'tasks', isMenuOpen: true } },
};

/** Com partes: a troca de parte fica no topo da gaveta. */
export const WithAreas: Story = {
  args: {
    data: {
      ...meta.args.data,
      areas: [
        { key: 'dashboard', label: 'Dashboard', icon: LayoutGrid },
        { key: 'operation', label: 'Operação', icon: ListChecks },
        { key: 'management', label: 'Gestão', icon: SlidersHorizontal },
      ],
    },
    state: { activeKey: 'tasks', activeArea: 'operation', isMenuOpen: true },
  },
};
