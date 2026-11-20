import type { Meta, StoryObj } from '@storybook/react';

import { themeColor } from '../../../../lib/utils/theme-color.util';
import { AzuosWidgetChart } from './azuos-widget-chart.component';

const SLICES = [
  { label: 'Em andamento', value: 514 },
  { label: 'Concluído', value: 69 },
  { label: 'Pago', value: 40 },
  { label: 'Isento', value: 22 },
  { label: 'Aguardando cliente', value: 11 },
];

const meta = {
  title: 'Dashboard/AzuosWidgetChart',
  component: AzuosWidgetChart,
  args: { data: { chart: { kind: 'pie', slices: SLICES }, seriesLabel: 'alvarás' } },
  decorators: [
    (Story) => (
      <div className="h-80 w-[32rem]">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof AzuosWidgetChart>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Pie: Story = {};

export const Rose: Story = {
  args: { data: { chart: { kind: 'rose', slices: SLICES }, seriesLabel: 'alvarás' } },
};

export const HalfDonut: Story = {
  args: { data: { chart: { kind: 'halfDonut', slices: SLICES }, seriesLabel: 'alvarás' } },
};

export const Pareto: Story = {
  args: { data: { chart: { kind: 'pareto', slices: SLICES }, seriesLabel: 'alvarás' } },
};

export const Cumulative: Story = {
  args: {
    data: {
      chart: {
        kind: 'cumulative',
        points: [
          { key: '2026-07', value: 30 },
          { key: '2026-08', value: 45 },
          { key: '2026-09', value: 12 },
          { key: '2026-10', value: 60 },
        ],
      },
      seriesLabel: 'alvarás',
    },
  },
};

export const Grouped: Story = {
  args: {
    data: {
      chart: {
        kind: 'grouped',
        grouped: {
          series: [
            { key: 'amb', label: 'Ambiental', color: themeColor('--chart-1') },
            { key: 'bom', label: 'Bombeiros', color: themeColor('--chart-2') },
          ],
          categories: [
            { label: 'Pago', values: { amb: 12, bom: 8 } },
            { label: 'Em andamento', values: { amb: 30, bom: 21 } },
          ],
        },
      },
      seriesLabel: 'alvarás',
    },
  },
};

export const Loading: Story = { args: { state: { isLoading: true } } };

/* Caso limite: o recorte não pegou nada — a frase do vazio, e não um quadro em branco. */
export const Empty: Story = {
  args: { data: { chart: { kind: 'pareto', slices: [] }, seriesLabel: 'alvarás' } },
};
