import type React from 'react';
import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router';
import { type Meta, type StoryObj } from '@storybook/react';

import { AzuosAppShellTargetLink } from './azuos-app-shell-target-link.component';

function withRouter(Story: () => React.JSX.Element) {
  const router = createRouter({
    routeTree: createRootRoute({ component: Story }),
    history: createMemoryHistory({ initialEntries: ['/'] }),
  });

  return <RouterProvider router={router} />;
}

const meta = {
  title: 'Navegação e estrutura/AzuosAppShellTargetLink',
  component: AzuosAppShellTargetLink,
  decorators: [withRouter],
  args: { data: { target: { to: '/profile' } }, children: 'Meu perfil' },
} satisfies Meta<typeof AzuosAppShellTargetLink>;

export default meta;

type Story = StoryObj<typeof meta>;

export const InternalRoute: Story = {};

export const OutsideNewTab: Story = {
  args: {
    data: { target: { href: 'https://grupoazuos.com.br', opensInNewTab: true } },
    children: 'Abrir chamado',
  },
};
