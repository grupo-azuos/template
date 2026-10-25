import { type Meta, type StoryObj } from '@storybook/react';

import { AzuosTreemapChart } from './azuos-treemap-chart.component';

const meta = {
  title: 'Gráficos e números/AzuosTreemapChart',
  component: AzuosTreemapChart,
} satisfies Meta<typeof AzuosTreemapChart>;

export default meta;

type Story = StoryObj<typeof meta>;

/* Uma cidade grande e uma cauda longa de pequenas — o caso para o qual o treemap existe. */
const SLICES = [
  { label: 'Cidade Grande', value: 3200 },
  { label: 'Cidade Média', value: 820 },
  { label: 'Cidade Vizinha', value: 510 },
  ...Array.from({ length: 40 }, (_, index) => ({ label: `Cidade ${index + 1}`, value: 40 - index })),
];

export const Default: Story = { args: { data: { slices: SLICES, seriesLabel: 'Alvarás' }, ui: { heightClass: 'h-80' } } };

export const FewBlocks: Story = {
  args: { data: { slices: SLICES, seriesLabel: 'Alvarás' }, ui: { heightClass: 'h-80', maxItems: 5 } },
};

export const Loading: Story = {
  args: { data: { slices: [], seriesLabel: 'Alvarás' }, state: { isLoading: true }, ui: { heightClass: 'h-80' } },
};

export const Empty: Story = {
  args: { data: { slices: [], seriesLabel: 'Alvarás' }, ui: { heightClass: 'h-80', emptyLabel: 'Nenhuma cidade' } },
};
