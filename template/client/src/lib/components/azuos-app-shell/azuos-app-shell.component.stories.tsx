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
  FileCheck,
  LayoutGrid,
  LifeBuoy,
  ListChecks,
  SlidersHorizontal,
  Users,
} from 'lucide-react';
import { fn } from 'storybook/test';

import { AzuosAppShell } from './azuos-app-shell.component';

/** `Link` exige um `RouterProvider` por perto: a rota raiz É a própria story. */
function withRouter(Story: () => React.JSX.Element) {
  const router = createRouter({
    routeTree: createRootRoute({ component: Story }),
    history: createMemoryHistory({ initialEntries: ['/tasks'] }),
  });

  return <RouterProvider router={router} />;
}

const items = [
  { key: 'tasks', label: 'Tarefas', to: '/tasks', icon: ListChecks, area: 'operation' },
  { key: 'schedule', label: 'Cronograma', to: '/schedule', icon: CalendarRange, area: 'operation' },
  { key: 'reports', label: 'Relatórios', to: '/reports', icon: BarChart3, area: 'operation' },
  { key: 'team', label: 'Equipe', to: '/team', icon: Users, area: 'operation' },
];

const meta = {
  title: 'Navegação e estrutura/AzuosAppShell',
  component: AzuosAppShell,
  decorators: [withRouter],
  parameters: { layout: 'fullscreen' },
  args: {
    children: <div className="text-ink-700 p-8 text-sm">Conteúdo da rota entra aqui.</div>,
    data: {
      user: { name: 'Ana Souza', role: 'Administradora' },
      areas: [],
      items,
      actions: [
        { key: 'support', label: 'Abrir chamado', icon: LifeBuoy, href: '/support', opensInNewTab: true },
        { key: 'verify', label: 'Validar documento', icon: FileCheck, href: '/verify', opensInNewTab: true },
      ],
      profile: { to: '/profile' },
      badges: { schedule: 3 },
    },
    state: { activeKey: 'tasks' },
    actions: { onSelectArea: fn(), onSignOut: fn() },
  },
} satisfies Meta<typeof AzuosAppShell>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Sem partes: uma coluna, ícone + rótulo. */
export const OneColumn: Story = {};

/** Recolhida: só ícones, com o nome na dica. */
export const OneColumnCollapsed: Story = {
  args: { state: { activeKey: 'tasks', isCollapsed: true } },
};

/** Com partes: o trilho de ícones com as partes e o painel com os itens rotulados. */
export const TwoColumns: Story = {
  args: {
    data: {
      ...meta.args.data,
      areas: [
        { key: 'dashboard', label: 'Dashboard', icon: LayoutGrid },
        { key: 'operation', label: 'Operação', icon: ListChecks },
        { key: 'management', label: 'Gestão', icon: SlidersHorizontal },
      ],
    },
    state: { activeKey: 'tasks', activeArea: 'operation' },
  },
};

/** Duas colunas recolhida: sobra o trilho, com os itens da parte em ícone. */
export const TwoColumnsCollapsed: Story = {
  args: { ...TwoColumns.args, state: { ...TwoColumns.args?.state, isCollapsed: true } },
};

/** Celular: barra de baixo com 3 itens + ☰. */
export const Mobile: Story = {
  globals: { viewport: { value: 'mobile1', isRotated: false } },
};

export const SigningOut: Story = {
  args: { state: { activeKey: 'tasks', isSigningOut: true } },
};
