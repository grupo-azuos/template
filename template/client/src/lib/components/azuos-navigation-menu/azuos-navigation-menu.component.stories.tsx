import { type Meta, type StoryObj } from '@storybook/react';

import { AzuosNavigationMenu } from './azuos-navigation-menu.component';

const meta = {
  title: 'Navegação e estrutura/AzuosNavigationMenu',
  component: AzuosNavigationMenu,
} satisfies Meta<typeof AzuosNavigationMenu>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    data: {
      items: [
        { label: 'Visão geral', href: '/tasks/12', isActive: true },
        { label: 'Histórico', href: '/tasks/12/history' },
        { label: 'Anexos', href: '/tasks/12/files' },
      ],
    },
    ui: { ariaLabel: 'Seções da tarefa' },
  },
};

/** Nenhuma seção marcada: acontece enquanto a rota resolve. Nada fica aceso por engano. */
export const NothingActive: Story = {
  args: {
    data: {
      items: [
        { label: 'Visão geral', href: '/tasks/12' },
        { label: 'Histórico', href: '/tasks/12/history' },
      ],
    },
    ui: { ariaLabel: 'Seções da tarefa' },
  },
};

/** Menu sem itens não é um menu: nada é desenhado. */
export const Empty: Story = {
  args: { data: { items: [] }, ui: { ariaLabel: 'Seções da tarefa' } },
};

/** Caso limite: muitas seções numa coluna estreita — quebram em linhas, não saem cortadas. */
export const ManySectionsInNarrowColumn: Story = {
  args: {
    data: {
      items: ['Visão geral', 'Histórico', 'Anexos', 'Responsáveis', 'Etiquetas'].map(
        (label, index) => ({
          label,
          href: '/tasks/12/' + index,
          isActive: index === 0,
        }),
      ),
    },
    ui: { ariaLabel: 'Seções da tarefa' },
  },
  render: (args) => (
    <div className="border-ink-300 w-72 border border-dashed p-2">
      <AzuosNavigationMenu {...args} />
    </div>
  ),
};
