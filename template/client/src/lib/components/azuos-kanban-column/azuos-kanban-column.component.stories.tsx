import { type Meta, type StoryObj } from '@storybook/react';
import { fn } from 'storybook/test';

import { AzuosKanbanColumn } from './azuos-kanban-column.component';

const card = (text: string) => (
  <div className="rounded-box border border-border bg-card p-3 text-sm shadow-xs">{text}</div>
);

const meta = {
  title: 'Listas e tabelas/AzuosKanbanColumn',
  component: AzuosKanbanColumn,
  args: {
    data: { title: 'Desenvolvimento', count: 2 },
    ui: { tone: 'info' },
    actions: { onDropItem: fn(), onAdd: fn() },
    children: (
      <>
        {card('Painel comercial')}
        {card('Central de chamados')}
      </>
    ),
  },
} satisfies Meta<typeof AzuosKanbanColumn>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const AllTones: Story = {
  render: () => (
    <div className="flex gap-4 overflow-x-auto">
      {(['neutral', 'info', 'warning', 'brand', 'success', 'danger'] as const).map((tone) => (
        <AzuosKanbanColumn key={tone} data={{ title: tone, count: 1 }} ui={{ tone }}>
          {card('Cartão')}
        </AzuosKanbanColumn>
      ))}
    </div>
  ),
};

export const Empty: Story = {
  args: { data: { title: 'Deploy', count: 0 }, ui: { tone: 'brand' }, children: null },
};

/** Sem "Adicionar": a tela não permite criar direto nesta coluna. */
export const WithoutAdd: Story = {
  args: { actions: { onDropItem: fn() } },
};

/** Caso limite: título comprido e muitos cartões. */
export const LongTitleManyCards: Story = {
  args: {
    data: { title: 'Uma etapa com um nome comprido demais para a coluna', count: 8 },
    children: (
      <>
        {Array.from({ length: 8 }, (_, index) => (
          <div key={index}>{card(`Cartão ${index + 1}`)}</div>
        ))}
      </>
    ),
  },
};
