import { type Meta, type StoryObj } from '@storybook/react';

import { AzuosEchart } from './azuos-echart.component';

const meta = {
  title: 'Gráficos e números/AzuosEchart',
  component: AzuosEchart,
} satisfies Meta<typeof AzuosEchart>;

export default meta;

type Story = StoryObj<typeof meta>;

const OPTION = {
  xAxis: { type: 'category' as const, data: ['Jan', 'Fev', 'Mar', 'Abr'] },
  yAxis: { type: 'value' as const },
  series: [{ type: 'bar' as const, data: [12, 18, 9, 22] }],
};

export const Default: Story = {
  args: {
    data: { option: OPTION, description: 'Tarefas por mês' },
    ui: { heightClass: 'h-64', className: 'w-96' },
  },
};

export const Scrolling: Story = {
  args: {
    data: { option: OPTION, description: 'Tarefas por mês' },
    ui: { heightClass: 'h-40', className: 'w-96', scrollHeight: 480 },
  },
};

export const Loading: Story = {
  args: {
    data: { option: OPTION, description: 'x' },
    state: { isLoading: true },
    ui: { heightClass: 'h-64' },
  },
};

export const Empty: Story = {
  args: {
    data: { option: OPTION, description: 'x' },
    state: { isEmpty: true },
    ui: { heightClass: 'h-64', emptyLabel: 'Nenhuma tarefa no período' },
  },
};
