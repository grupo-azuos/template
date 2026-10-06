import { type Meta, type StoryObj } from '@storybook/react';

import { AzuosRadialChart } from './azuos-radial-chart.component';

const meta = {
  title: 'Gráficos e números/AzuosRadialChart',
  component: AzuosRadialChart,
} satisfies Meta<typeof AzuosRadialChart>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    data: { value: 84, max: 96, label: 'Concluídas', hint: 'de 96 tarefas' },
    ui: { className: 'w-48' },
  },
};

/** O arco de trás é o que dá escala: sem ele, 20% e 80% seriam só dois riscos. */
export const LowValue: Story = {
  args: {
    data: { value: 12, max: 96, label: 'Concluídas', hint: 'de 96 tarefas' },
    ui: { className: 'w-48', color: 'var(--chart-4)' },
  },
};

/** O número do meio pode ser escrito à mão, para uma unidade ou uma razão. */
export const CustomDisplay: Story = {
  args: {
    data: { value: 72, label: 'Prazo', display: '72%', hint: 'do mês decorrido' },
    ui: { className: 'w-48', color: 'var(--chart-3)' },
  },
};

export const Loading: Story = {
  args: {
    data: { value: 0, label: 'Concluídas' },
    state: { isLoading: true },
    ui: { className: 'w-48' },
  },
};

/** Caso limite: valor acima do teto — o arco para na volta completa, não dá duas voltas. */
export const AboveTheCeiling: Story = {
  args: {
    data: { value: 120, max: 96, label: 'Concluídas', hint: 'medida inconsistente' },
    ui: { className: 'w-48' },
  },
};
