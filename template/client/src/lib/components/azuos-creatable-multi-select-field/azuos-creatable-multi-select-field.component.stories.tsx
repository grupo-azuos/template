import type { Meta, StoryObj } from '@storybook/react';
import { fn } from 'storybook/test';

import { AzuosCreatableMultiSelectField } from './azuos-creatable-multi-select-field.component';

const OPTIONS = [
  { value: '1', label: 'Alteração' },
  { value: '2', label: 'Assinatura de documentos' },
  { value: '3', label: 'Baixa' },
  { value: '4', label: 'Constituição' },
];

const meta = {
  title: 'Components/AzuosCreatableMultiSelectField',
  component: AzuosCreatableMultiSelectField,
  args: {
    data: { value: ['2'], options: OPTIONS },
    ui: { ariaLabel: 'Tipos', placeholder: 'Escolha ou cadastre os tipos' },
    actions: { onChange: fn(), onCreate: fn() },
  },
  decorators: [
    (Story) => (
      <div className="w-[24rem] p-4">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof AzuosCreatableMultiSelectField>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** Dois escolhidos no mesmo registro. */
export const TwoChosen: Story = { args: { data: { value: ['1', '2'], options: OPTIONS } } };

/** Catálogo vazio: o campo convida a cadastrar. */
export const Empty: Story = { args: { data: { value: [], options: [] } } };

export const Disabled: Story = { args: { state: { isDisabled: true } } };

/** Caso limite: tudo escolhido — o gatilho corta, a lista mostra todos. */
export const AllChosen: Story = {
  args: { data: { value: ['1', '2', '3', '4'], options: OPTIONS } },
};
