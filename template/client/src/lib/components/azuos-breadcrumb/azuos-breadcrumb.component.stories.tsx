import { type Meta, type StoryObj } from '@storybook/react';

import { AzuosBreadcrumb } from './azuos-breadcrumb.component';

const meta = {
  title: 'Navegação e estrutura/AzuosBreadcrumb',
  component: AzuosBreadcrumb,
} satisfies Meta<typeof AzuosBreadcrumb>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    data: {
      items: [{ label: 'Tarefas', href: '/tasks' }, { label: 'Revisar contrato' }],
    },
  },
};

export const ThreeLevels: Story = {
  args: {
    data: {
      items: [
        { label: 'Tarefas', href: '/tasks' },
        { label: 'Revisar contrato', href: '/tasks/12' },
        { label: 'Histórico' },
      ],
    },
  },
};

/** Parada sem destino vira texto: um nível que existe na trilha mas não tem tela própria. */
export const LevelWithoutLink: Story = {
  args: {
    data: [
      { label: 'Tarefas', href: '/tasks' },
      { label: 'Arquivadas' },
      { label: 'Revisar contrato' },
    ].reduce((data, item) => ({ items: [...data.items, item] }), {
      items: [] as { label: string; href?: string }[],
    }),
  },
};

/** Um nível só: a página atual, sem separador nenhum. */
export const SingleLevel: Story = {
  args: { data: { items: [{ label: 'Tarefas' }] } },
};

/** Trilha vazia não desenha nada — nem uma linha vazia empurrando o conteúdo. */
export const Empty: Story = {
  args: { data: { items: [] } },
};

/** Caso limite: nome longo numa coluna estreita — quebra, não estoura a largura. */
export const LongLabelInNarrowColumn: Story = {
  args: {
    data: {
      items: [
        { label: 'Tarefas', href: '/tasks' },
        { label: 'Revisar o contrato de prestação de serviços do segundo semestre' },
      ],
    },
  },
  render: (args) => (
    <div className="border-ink-300 w-56 border border-dashed p-2">
      <AzuosBreadcrumb {...args} />
    </div>
  ),
};
