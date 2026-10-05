import { type Meta, type StoryObj } from '@storybook/react';
import { ListChecks } from 'lucide-react';

import { SidebarMenu, SidebarProvider } from '../ui/sidebar';
import { AzuosAppShellNavEntry } from './azuos-app-shell-nav-entry.component';

/**
 * O item precisa do contexto da barra lateral e do roteador para desenhar — o `Link` do TanStack
 * resolve o endereço contra a árvore de rotas. No Storybook ele vive dentro do `SidebarProvider`; a
 * navegação de verdade só acontece na aplicação.
 */
const meta = {
  title: 'Primitives/AzuosAppShellNavEntry',
  component: AzuosAppShellNavEntry,
  decorators: [
    (Story) => (
      <SidebarProvider>
        <div className="bg-sidebar w-64 p-2">
          <SidebarMenu>
            <Story />
          </SidebarMenu>
        </div>
      </SidebarProvider>
    ),
  ],
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
