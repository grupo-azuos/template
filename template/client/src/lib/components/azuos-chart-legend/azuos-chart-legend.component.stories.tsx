import { type Meta, type StoryObj } from '@storybook/react';

import { AzuosChartLegend } from './azuos-chart-legend.component';

const meta = {
  title: 'Gráficos e números/AzuosChartLegend',
  component: AzuosChartLegend,
} satisfies Meta<typeof AzuosChartLegend>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    data: {
      series: [
        { key: 'done', label: 'Concluídas', color: 'var(--chart-2)' },
        { key: 'open', label: 'Abertas', color: 'var(--chart-1)' },
        { key: 'late', label: 'Atrasadas', color: 'var(--chart-4)' },
      ],
    },
  },
};

/** Uma série só não ganha legenda: o título do bloco já diz o que está desenhado. */
export const SingleSeries: Story = {
  args: { data: { series: [{ key: 'done', label: 'Concluídas', color: 'var(--chart-2)' }] } },
};

/** Caso limite: muitas séries numa coluna estreita — quebram em linhas, não saem cortadas. */
export const ManySeriesInNarrowColumn: Story = {
  args: {
    data: {
      series: Array.from({ length: 7 }, (_, index) => ({
        key: 'serie-' + index,
        label: 'Categoria ' + (index + 1),
        color: 'var(--chart-' + ((index % 5) + 1) + ')',
      })),
    },
  },
  render: (args) => (
    <div className="border-ink-300 w-56 border border-dashed p-2">
      <AzuosChartLegend {...args} />
    </div>
  ),
};
