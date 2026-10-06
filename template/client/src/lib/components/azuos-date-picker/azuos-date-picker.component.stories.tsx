import { type Meta, type StoryObj } from '@storybook/react';
import { fn } from 'storybook/test';

import { AzuosDatePicker } from './azuos-date-picker.component';

const meta = {
  title: 'Formulários/AzuosDatePicker',
  component: AzuosDatePicker,
  args: { actions: { onChange: fn() } },
} satisfies Meta<typeof AzuosDatePicker>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    data: { name: 'dueDate', value: '2026-10-20' },
    ui: { ariaLabel: 'Prazo', className: 'w-64' },
  },
};

/** Vazio: o texto de ajuda fica no tom de "nada escolhido", não no tom de valor. */
export const Empty: Story = {
  args: {
    data: { name: 'dueDate', value: null },
    ui: { ariaLabel: 'Prazo', placeholder: 'Escolha o prazo', className: 'w-64' },
  },
};

export const Disabled: Story = {
  args: {
    data: { name: 'dueDate', value: '2026-10-20' },
    ui: { ariaLabel: 'Prazo', className: 'w-64' },
    state: { isDisabled: true },
  },
};

/**
 * Caso limite: primeiro dia do mês. É aqui que uma conversão por UTC mostraria o dia anterior —
 * "01/11/2026" viraria "31/10/2026" para quem está no Brasil.
 */
export const FirstDayOfTheMonth: Story = {
  args: {
    data: { name: 'dueDate', value: '2026-11-01' },
    ui: { ariaLabel: 'Prazo', className: 'w-64' },
  },
};

/** Caso limite: campo estreito — a data corta em vez de estourar a largura. */
export const NarrowField: Story = {
  args: {
    data: { name: 'dueDate', value: '2026-10-20' },
    ui: { ariaLabel: 'Prazo', className: 'w-32' },
  },
};
