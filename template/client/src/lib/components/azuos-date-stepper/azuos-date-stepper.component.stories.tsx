import { type Meta, type StoryObj } from '@storybook/react';
import { fn } from 'storybook/test';

import { AzuosDateStepper } from './azuos-date-stepper.component';

const meta = {
  title: 'Formulários/AzuosDateStepper',
  component: AzuosDateStepper,
  args: { actions: { onChange: fn() } },
  decorators: [
    (Story) => (
      <div className="rounded-surface border-border bg-card inline-block border shadow-xl">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof AzuosDateStepper>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Vazio: a primeira pergunta é o ano, e a lista abre no ano atual. */
export const Default: Story = {
  args: { data: { value: null } },
};

/** Data de nascimento: a lista de anos abre perto de 1990 e não passa de hoje. */
export const BirthDate: Story = {
  args: {
    data: { value: null, max: '2026-10-11' },
    ui: { startYear: 1990 },
  },
};

/** Com data escolhida: abre direto no dia, com o ano e o mês no topo para trocar. */
export const WithValue: Story = {
  args: { data: { value: '1990-03-25' } },
};

/** Com limite: os meses e os dias fora da faixa ficam apagados e não respondem. */
export const WithLimits: Story = {
  args: { data: { value: '2026-10-15', min: '2026-10-10', max: '2026-11-20' } },
};

/** Caso limite: fevereiro de ano bissexto tem 29 dias. */
export const LeapYearFebruary: Story = {
  args: { data: { value: '2024-02-29' } },
};

/** Caso limite: mês que começa no sábado ocupa seis linhas de dias. */
export const SixWeekMonth: Story = {
  args: { data: { value: '2026-08-31' } },
};
