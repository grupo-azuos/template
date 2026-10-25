import { type Meta, type StoryObj } from '@storybook/react';

import { AzuosSankeyChart } from './azuos-sankey-chart.component';

const meta = {
  title: 'Gráficos e números/AzuosSankeyChart',
  component: AzuosSankeyChart,
} satisfies Meta<typeof AzuosSankeyChart>;

export default meta;

type Story = StoryObj<typeof meta>;

const DATA = {
  nodes: [
    { id: 'type:Contrato', label: 'Contrato', color: '#3b82f6' },
    { id: 'type:Parecer', label: 'Parecer', color: '#8b5cf6' },
    { id: 'owner:Ana', label: 'Ana', color: '#10b981' },
    { id: 'owner:Caio', label: 'Caio', color: '#06b6d4' },
    { id: 'stage:Feito', label: 'Feito', color: '#047857' },
    { id: 'stage:Parado', label: 'Parado', color: '#b45309' },
  ],
  links: [
    { from: 'type:Contrato', to: 'owner:Ana', value: 12 },
    { from: 'type:Contrato', to: 'owner:Caio', value: 4 },
    { from: 'type:Parecer', to: 'owner:Caio', value: 9 },
    { from: 'owner:Ana', to: 'stage:Feito', value: 10 },
    { from: 'owner:Ana', to: 'stage:Parado', value: 2 },
    { from: 'owner:Caio', to: 'stage:Feito', value: 5 },
    { from: 'owner:Caio', to: 'stage:Parado', value: 8 },
  ],
  seriesLabel: 'Tarefas',
};

export const Default: Story = { args: { data: DATA, ui: { heightClass: 'h-80' } } };

export const Loading: Story = { args: { data: DATA, state: { isLoading: true }, ui: { heightClass: 'h-80' } } };

export const Empty: Story = {
  args: { data: { ...DATA, links: [] }, ui: { heightClass: 'h-80', emptyLabel: 'Nenhuma tarefa no período' } },
};
