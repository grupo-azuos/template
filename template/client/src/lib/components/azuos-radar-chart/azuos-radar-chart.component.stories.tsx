import { type Meta, type StoryObj } from '@storybook/react';

import { AzuosRadarChart } from './azuos-radar-chart.component';

const meta = {
  title: 'Gráficos e números/AzuosRadarChart',
  component: AzuosRadarChart,
} satisfies Meta<typeof AzuosRadarChart>;

export default meta;

type Story = StoryObj<typeof meta>;

const SLICES = [
  { label: 'Comercial', value: 18 },
  { label: 'Financeiro', value: 7 },
  { label: 'Jurídico', value: 12 },
  { label: 'Operações', value: 22 },
  { label: 'Suporte', value: 15 },
  { label: 'Tecnologia', value: 9 },
];

export const Default: Story = {
  args: { data: { slices: SLICES, seriesLabel: 'Tarefas' }, ui: { className: 'w-96' } },
};

export const AnotherColour: Story = {
  args: {
    data: { slices: SLICES, seriesLabel: 'Tarefas' },
    ui: { className: 'w-96', color: 'var(--chart-5)' },
  },
};

export const Loading: Story = {
  args: {
    data: { slices: [], seriesLabel: 'Tarefas' },
    state: { isLoading: true },
    ui: { className: 'w-96' },
  },
};

export const Empty: Story = {
  args: {
    data: { slices: [], seriesLabel: 'Tarefas' },
    ui: { className: 'w-96', emptyLabel: 'Nenhuma tarefa no período' },
  },
};

/**
 * Caso limite: nomes longos. Eles são cortados no eixo para não se encavalarem; o nome inteiro
 * continua no balão e na lista para leitor de tela.
 */
export const LongCategoryNames: Story = {
  args: {
    data: {
      slices: [
        { label: 'Comercial e pré-vendas', value: 18 },
        { label: 'Financeiro e cobrança', value: 7 },
        { label: 'Jurídico e contratos', value: 12 },
        { label: 'Operações e logística', value: 22 },
      ],
      seriesLabel: 'Tarefas',
    },
    ui: { className: 'w-96' },
  },
};
