import { type Meta, type StoryObj } from '@storybook/react';

import { AzuosChartValueList } from './azuos-chart-value-list.component';

/* A lista é `sr-only`: na história ela não aparece — só o leitor de tela a encontra. */
const meta = {
  title: 'Gráficos e números/AzuosChartValueList',
  component: AzuosChartValueList,
} satisfies Meta<typeof AzuosChartValueList>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { data: { slices: [{ label: 'Goiânia', value: 3357 }, { label: 'Anápolis', value: 541 }] } },
};

export const Empty: Story = { args: { data: { slices: [] } } };
