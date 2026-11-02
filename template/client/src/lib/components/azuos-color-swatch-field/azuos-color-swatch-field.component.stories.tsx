import { type Meta, type StoryObj } from '@storybook/react';
import { fn } from 'storybook/test';

import { COMPANY_COLOR_PALETTE } from '../../utils/company-color.util';
import { themeColor } from '../../utils/theme-color.util';
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
  args: { data: { value: COMPANY_COLOR_PALETTE[2] } },
};

/** Cor livre, fora da paleta: o quadrado do seletor assume a cor e fica marcado. */
export const CustomColorSelected: Story = {
  args: { data: { value: themeColor('--brand-blue-900') } },
};

export const Disabled: Story = {
  args: { data: { value: COMPANY_COLOR_PALETTE[0] }, state: { isDisabled: true } },
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
