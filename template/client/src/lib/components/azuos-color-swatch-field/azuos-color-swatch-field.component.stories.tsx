import { type Meta, type StoryObj } from '@storybook/react';
import { fn } from 'storybook/test';

import { AzuosColorSwatchField } from './azuos-color-swatch-field.component';

const meta = {
  title: 'Formulários/AzuosColorSwatchField',
  component: AzuosColorSwatchField,
  args: { data: { value: '' }, actions: { onChange: fn() } },
} satisfies Meta<typeof AzuosColorSwatchField>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Sem escolha: "Aleatória" marcada — o servidor sorteia da paleta. */
export const Default: Story = {};

export const PaletteColorSelected: Story = {
  args: { data: { value: '#7c3aed' } },
};

/** Cor livre, fora da paleta: o quadrado do seletor assume a cor e fica marcado. */
export const CustomColorSelected: Story = {
  args: { data: { value: '#0f766e' } },
};

export const Disabled: Story = {
  args: { data: { value: '#2563eb' }, state: { isDisabled: true } },
};

/** Caso limite: largura estreita — os quadrados quebram linha em vez de estourar. */
export const Narrow: Story = {
  decorators: [
    (Story) => (
      <div className="w-40">
        <Story />
      </div>
    ),
  ],
};
