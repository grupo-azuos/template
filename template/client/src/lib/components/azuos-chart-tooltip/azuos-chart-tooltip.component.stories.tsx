import { type Meta, type StoryObj } from '@storybook/react';
import { Bar, BarChart, XAxis } from 'recharts';

import { AzuosChartFrame } from '../azuos-chart-frame/azuos-chart-frame.component';
import { ChartTooltip } from '../ui/chart';
import { AzuosChartTooltip } from './azuos-chart-tooltip.component';

const meta = {
  title: 'Gráficos e números/AzuosChartTooltip',
  component: AzuosChartTooltip,
} satisfies Meta<typeof AzuosChartTooltip>;

export default meta;

type Story = StoryObj<typeof meta>;

const ROWS = [
  { label: 'Seg', value: 1240 },
  { label: 'Ter', value: 1810 },
  { label: 'Qua', value: 920 },
];

/**
 * Passe o ponteiro sobre uma coluna. O número sai com o ponto de milhar de quem lê em português —
 * `1.240`, não `1,240`.
 */
export const Default: Story = {
  render: () => (
    <AzuosChartFrame
      data={{ config: { value: { label: 'Tarefas', color: 'var(--chart-1)' } } }}
      ui={{ heightClass: 'h-56' }}
    >
      <BarChart data={ROWS}>
        <XAxis dataKey="label" tickLine={false} axisLine={false} />
        <ChartTooltip
          cursor={{ fill: 'var(--color-muted)' }}
          content={<AzuosChartTooltip nameKey="value" />}
        />
        <Bar dataKey="value" fill="var(--color-value)" radius={[4, 4, 0, 0]} />
      </BarChart>
    </AzuosChartFrame>
  ),
};
