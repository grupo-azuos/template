import { type Meta, type StoryObj } from '@storybook/react';
import { useState } from 'react';

import { type FieldMask } from '../../utils/field-mask.util';

import { AzuosMaskedTextField } from './azuos-masked-text-field.component';

/** Digite ou cole: a pontuação entra sozinha, e o erro aparece ao sair do campo. */
function Playground({
  mask,
  label,
  initial = '',
}: {
  mask: FieldMask;
  label: string;
  initial?: string;
}) {
  const [value, setValue] = useState(initial);

  return (
    <AzuosMaskedTextField
      data={{ label, name: mask, value }}
      ui={{ mask, className: 'max-w-xs' }}
      actions={{ onChange: setValue }}
    />
  );
}

const meta = {
  title: 'Formulários/AzuosMaskedTextField',
  component: AzuosMaskedTextField,
  parameters: { layout: 'padded' },
  args: {
    data: { label: 'CPF', name: 'cpf', value: '' },
    ui: { mask: 'cpf' },
    actions: { onChange: () => undefined },
  },
} satisfies Meta<typeof AzuosMaskedTextField>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Cpf: Story = { render: () => <Playground mask="cpf" label="CPF" /> };
export const Cin: Story = { render: () => <Playground mask="cin" label="CIN (número do CPF)" /> };
export const Cnh: Story = { render: () => <Playground mask="cnh" label="Número da CNH" /> };
export const Cnpj: Story = { render: () => <Playground mask="cnpj" label="CNPJ" /> };
export const Cep: Story = { render: () => <Playground mask="cep" label="CEP" /> };
export const Cnae: Story = { render: () => <Playground mask="cnae" label="CNAE" /> };
export const Money: Story = {
  render: () => <Playground mask="money" label="Valor nominal da quota (R$)" initial="1,00" />,
};
export const Integer: Story = {
  render: () => <Playground mask="integer" label="Quantidade de quotas" initial="60.000" />,
};

/** Caso limite: CPF completo com o dígito verificador errado já chega avisando. */
export const InvalidCpf: Story = {
  args: {
    data: { label: 'CPF', name: 'cpf', value: '529.982.247-24' },
    state: { error: 'CPF inválido — confira os números' },
  },
};

export const Disabled: Story = {
  args: {
    data: { label: 'CEP', name: 'cep', value: '74000-000' },
    ui: { mask: 'cep' },
    state: { isDisabled: true },
  },
};
