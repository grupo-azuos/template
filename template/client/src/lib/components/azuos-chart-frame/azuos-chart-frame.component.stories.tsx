import { type Meta, type StoryObj } from '@storybook/react';
import { Bar, BarChart, XAxis } from 'recharts';

import { AzuosChartFrame } from './azuos-chart-frame.component';

const meta = {
  title: 'Gráficos e números/AzuosChartFrame',
  component: AzuosChartFrame,
} satisfies Meta<typeof AzuosChartFrame>;

export default meta;

type Story = StoryObj<typeof meta>;

const ROWS = [
  { label: 'Seg', value: 12 },
  { label: 'Ter', value: 18 },
  { label: 'Qua', value: 9 },
  { label: 'Qui', value: 22 },
  { label: 'Sex', value: 14 },
];

const CONFIG = { value: { label: 'Tarefas', color: 'var(--chart-1)' } };

export const Default: Story = {
  args: {
    data: { config: CONFIG },
    children: (
      <BarChart data={ROWS}>
        <XAxis dataKey="label" tickLine={false} axisLine={false} />
        <Bar dataKey="value" fill="var(--color-value)" radius={[4, 4, 0, 0]} />
      </BarChart>
    ),
  },
};

/** Carregando: um bloco pulsando com a MESMA altura do gráfico — a tela não salta depois. */
export const Loading: Story = {
  args: { data: { config: CONFIG }, state: { isLoading: true }, children: <BarChart data={[]} /> },
};

/** Vazio é uma frase: um quadro em branco se lê como defeito, e a pessoa recarrega a página. */
export const Empty: Story = {
  args: {
    data: { config: CONFIG },
    state: { isEmpty: true },
    ui: { emptyLabel: 'Nenhuma tarefa no período' },
    children: <BarChart data={[]} />,
  },
};

/** A altura é decisão de quem chama: três blocos lado a lado só alinham com a mesma caixa. */
export const TallerBox: Story = {
  args: {
    data: { config: CONFIG },
    ui: { heightClass: 'h-72' },
    children: (
      <BarChart data={ROWS}>
        <XAxis dataKey="label" tickLine={false} axisLine={false} />
        <Bar dataKey="value" fill="var(--color-value)" radius={[4, 4, 0, 0]} />
      </BarChart>
    ),
  },
};
