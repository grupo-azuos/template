import { type Meta, type StoryObj } from '@storybook/react';

import { AzuosHeatmapChart } from './azuos-heatmap-chart.component';

const meta = {
  title: 'Gráficos e números/AzuosHeatmapChart',
  component: AzuosHeatmapChart,
} satisfies Meta<typeof AzuosHeatmapChart>;

export default meta;

type Story = StoryObj<typeof meta>;

const ROWS = ['Ana', 'Caio', 'Duda', 'Edu', 'Fabi', 'Gil', 'Hugo', 'Iara', 'João', 'Lia'];
const COLUMNS = ['Feito', 'Andando', 'Parado', 'Fora'];

const DATA = {
  rows: ROWS,
  columns: COLUMNS,
  cells: ROWS.flatMap((row, rowIndex) =>
    COLUMNS.map((column, columnIndex) => ({ row, column, value: ((rowIndex + 2) * (columnIndex + 3)) % 17 })),
  ),
  seriesLabel: 'Tarefas',
};

export const Default: Story = { args: { data: DATA, ui: { heightClass: 'h-80' } } };

export const AnotherColour: Story = { args: { data: DATA, ui: { heightClass: 'h-80', color: 'var(--warning)' } } };

export const Loading: Story = { args: { data: DATA, state: { isLoading: true }, ui: { heightClass: 'h-80' } } };

export const Empty: Story = {
  args: { data: { ...DATA, cells: [] }, ui: { heightClass: 'h-80', emptyLabel: 'Nenhuma tarefa no período' } },
};
