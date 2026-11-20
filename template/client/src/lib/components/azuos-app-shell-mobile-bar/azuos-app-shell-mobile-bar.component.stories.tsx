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
  /* A barra só existe abaixo de 768px (`md:hidden`): na página Docs, larga, ela sumia. Cada
     variação vira um quadro de CELULAR de verdade (um iframe de 390 × 700, ver `docs.css`), onde
     a barra aparece embaixo e o "Menu" abre a gaveta dentro do quadro. */
  parameters: {
    layout: 'fullscreen',
    fullBleed: true,
    docs: { story: { inline: false, iframeHeight: 700 } },
  },
  globals: { viewport: { value: 'mobile1', isRotated: false } },
  args: {
    data: {
      user: { name: 'Ana Souza', role: 'Administradora' },
      areas: [],
      items: [
        { key: 'tasks', label: 'Tarefas', to: '/tasks', icon: ListChecks, area: 'operation' },
        {
          key: 'schedule',
          label: 'Cronograma',
          to: '/schedule',
          icon: CalendarRange,
          area: 'operation',
        },
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

/** Toque em "Menu": a gaveta de baixo abre com o menu inteiro; arrastar para baixo ou tocar fora fecha. */
export const MenuOpen: Story = {};

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
