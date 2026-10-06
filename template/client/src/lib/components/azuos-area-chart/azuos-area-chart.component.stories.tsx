import { type Meta, type StoryObj } from '@storybook/react';

import { AzuosAreaChart } from './azuos-area-chart.component';

const meta = {
  title: 'Gráficos e números/AzuosAreaChart',
  component: AzuosAreaChart,
} satisfies Meta<typeof AzuosAreaChart>;

export default meta;

type Story = StoryObj<typeof meta>;

const SERIES = [
  { key: 'created', label: 'Criadas', color: 'var(--chart-1)' },
  { key: 'done', label: 'Concluídas', color: 'var(--chart-2)' },
];

const POINTS = Array.from({ length: 14 }, (_, index) => ({
  at: new Date(2026, 8, index + 1).toISOString(),
  values: { created: 6 + ((index * 5) % 11), done: 3 + ((index * 3) % 8) },
}));

export const Default: Story = {
  args: { data: { points: POINTS, series: SERIES } },
};

/** Empilhado: a altura total é a soma — para séries que são PARTES de um todo. */
export const Stacked: Story = {
  args: { data: { points: POINTS, series: SERIES }, ui: { layout: 'stack' } },
};

/** Escala travada em 0–100, com folga em cima para o pico de 100% não sair achatado na borda. */
export const Percent: Story = {
  args: {
    data: {
      points: Array.from({ length: 12 }, (_, index) => ({
        at: new Date(2026, 8, 20, index + 8).toISOString(),
        values: { usage: index === 6 ? 100 : 40 + ((index * 9) % 50) },
      })),
      series: [{ key: 'usage', label: 'Uso', color: 'var(--chart-3)' }],
    },
    ui: { isPercent: true, tick: 'hour' },
  },
};

export const Loading: Story = {
  args: { data: { points: [], series: SERIES }, state: { isLoading: true } },
};

export const Empty: Story = {
  args: { data: { points: [], series: SERIES }, ui: { emptyLabel: 'Sem leituras no período' } },
};

/** Caso limite: leitura com data inválida — ela é descartada, e o gráfico continua de pé. */
export const WithBrokenReading: Story = {
  args: {
    data: {
      points: [{ at: 'a definir', values: { created: 4, done: 2 } }, ...POINTS.slice(0, 5)],
      series: SERIES,
    },
  },
};
