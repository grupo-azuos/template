import { type Meta, type StoryObj } from '@storybook/react';
import { fn } from 'storybook/test';

import { AzuosCheckboxField } from './azuos-checkbox-field.component';

const meta = {
  title: 'Formulários/AzuosCheckboxField',
  component: AzuosCheckboxField,
  args: {
    data: { label: 'Recebe a nota por e-mail', name: 'email-invoice', isChecked: false },
    actions: { onChange: fn() },
  },
} satisfies Meta<typeof AzuosCheckboxField>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Checked: Story = {
  args: { data: { label: 'Recebe a nota por e-mail', name: 'email-invoice', isChecked: true } },
};

export const WithDescription: Story = {
  args: {
    data: {
      label: 'Simples Nacional',
      name: 'regime',
      isChecked: false,
      description: 'Faturamento de até R$ 4,8 milhões por ano',
    },
  },
};

export const Disabled: Story = { args: { state: { isDisabled: true } } };

export const LongLabel: Story = {
  args: {
    data: {
      label:
        'Autorizo o escritório a transmitir as declarações acessórias em meu nome durante todo o exercício fiscal corrente',
      name: 'consent',
      isChecked: false,
    },
    ui: { className: 'max-w-80' },
  },
};
