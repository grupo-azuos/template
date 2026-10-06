import { type Meta, type StoryObj } from '@storybook/react';
import { fn } from 'storybook/test';

import { AzuosButtonGroup } from './azuos-button-group.component';

const meta = {
  title: 'Ações/AzuosButtonGroup',
  component: AzuosButtonGroup,
  args: { actions: { onChange: fn() } },
} satisfies Meta<typeof AzuosButtonGroup>;

export default meta;

type Story = StoryObj<typeof meta>;

const PERIODS = [
  { value: 'day', label: 'Dia' },
  { value: 'week', label: 'Semana' },
  { value: 'month', label: 'Mês' },
];

export const Default: Story = {
  args: { data: { options: PERIODS, value: 'week' }, ui: { ariaLabel: 'Período' } },
};

export const TwoOptions: Story = {
  args: {
    data: {
      options: [
        { value: 'open', label: 'Abertas' },
        { value: 'all', label: 'Todas' },
      ],
      value: 'open',
    },
    ui: { ariaLabel: 'Recorte da lista' },
  },
};

export const Vertical: Story = {
  args: {
    data: { options: PERIODS, value: 'day' },
    ui: { ariaLabel: 'Período', orientation: 'vertical' },
  },
};

export const Disabled: Story = {
  args: {
    data: { options: PERIODS, value: 'month' },
    ui: { ariaLabel: 'Período' },
    state: { isDisabled: true },
  },
};

/**
 * Caso limite: valor que não está entre as opções (um filtro vindo da URL, por exemplo). Nenhum
 * botão fica marcado — e isso é melhor que marcar o primeiro, que seria mentira.
 */
export const ValueOutsideTheOptions: Story = {
  args: { data: { options: PERIODS, value: 'year' }, ui: { ariaLabel: 'Período' } },
};
