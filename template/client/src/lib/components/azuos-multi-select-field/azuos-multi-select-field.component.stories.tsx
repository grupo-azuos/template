import { type Meta, type StoryObj } from '@storybook/react';
import { fn } from 'storybook/test';

import { AzuosMultiSelectField } from './azuos-multi-select-field.component';

const OPTIONS = [
  { value: 'simples', label: 'Simples Nacional' },
  { value: 'presumido', label: 'Lucro Presumido' },
  { value: 'real', label: 'Lucro Real' },
  { value: 'mei', label: 'MEI' },
];

const meta = {
  title: 'Formulários/AzuosMultiSelectField',
  component: AzuosMultiSelectField,
  args: {
    data: { values: [], options: OPTIONS, placeholder: 'Todos os regimes', noun: 'regimes' },
    ui: { ariaLabel: 'Regime', className: 'max-w-72' },
    actions: { onChange: fn() },
  },
} satisfies Meta<typeof AzuosMultiSelectField>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const TwoSelected: Story = {
  args: {
    data: {
      values: ['simples', 'real'],
      options: OPTIONS,
      placeholder: 'Todos os regimes',
      noun: 'regimes',
    },
  },
};

export const ManySelected: Story = {
  args: {
    data: {
      values: ['simples', 'real', 'mei'],
      options: OPTIONS,
      placeholder: 'Todos os regimes',
      noun: 'regimes',
    },
  },
};

export const Disabled: Story = { args: { state: { isDisabled: true } } };
