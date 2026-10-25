import { type Meta, type StoryObj } from '@storybook/react';

import { AzuosStackedBarChart } from './azuos-stacked-bar-chart.component';

const meta = {
  title: 'Gráficos e números/AzuosStackedBarChart',
  component: AzuosStackedBarChart,
} satisfies Meta<typeof AzuosStackedBarChart>;

export default meta;

type Story = StoryObj<typeof meta>;

const SERIES = [
  { key: 'done', label: 'Entregue', color: 'var(--success)' },
  { key: 'pending', label: 'Pendente', color: 'var(--warning)' },
  { key: 'other', label: 'Sem obrigação', color: 'var(--muted-foreground)' },
];

const CATEGORIES = ['Contrato', 'Parecer', 'Petição', 'Recurso', 'Acordo', 'Notificação', 'Procuração', 'Ata', 'Laudo', 'Ofício', 'Edital', 'Termo'].map(
  (label, index) => ({ label, values: { done: 20 - index, pending: 5 + (index % 4), other: index % 3 } }),
);

export const Default: Story = {
  args: { data: { categories: CATEGORIES, series: SERIES, seriesLabel: 'Documentos' }, ui: { heightClass: 'h-72' } },
};

export const Loading: Story = {
  args: { data: { categories: [], series: SERIES, seriesLabel: 'Documentos' }, state: { isLoading: true } },
};

export const Empty: Story = {
  args: {
    data: { categories: [], series: SERIES, seriesLabel: 'Documentos' },
    ui: { emptyLabel: 'Nenhum documento no período' },
  },
};
