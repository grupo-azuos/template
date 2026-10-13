import { type Meta, type StoryObj } from '@storybook/react';
import { useState } from 'react';
import { fn } from 'storybook/test';

import { AzuosDateField, type AzuosDateFieldProps } from './azuos-date-field.component';

/**
 * As histórias guardam o valor de verdade: sem isso o campo voltaria ao valor inicial a cada
 * escolha, e não daria para experimentar digitar nem percorrer ano, mês e dia.
 */
function StatefulDateField(args: AzuosDateFieldProps) {
  const [value, setValue] = useState(args.data.value);

  return (
    <div className="flex w-72 flex-col gap-2">
      <AzuosDateField
        {...args}
        data={{ ...args.data, value }}
        actions={{
          ...args.actions,
          onChange: (next) => {
            setValue(next);
            args.actions.onChange(next);
          },
        }}
      />
      <p className="text-ink-500 text-xs">Valor entregue: {value ?? 'nenhum'}</p>
    </div>
  );
}

const meta = {
  title: 'Formulários/AzuosDateField',
  component: AzuosDateField,
  args: { actions: { onChange: fn(), onBlur: fn() } },
  render: (args) => <StatefulDateField {...args} />,
} satisfies Meta<typeof AzuosDateField>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Vazio: digite `25031990` ou toque no calendário, que pergunta ano, mês e dia. */
export const Default: Story = {
  args: { data: { label: 'Data', name: 'date', value: null } },
};

/** Data de nascimento: não aceita data futura, e o calendário abre perto de 1990. */
export const BirthDate: Story = {
  args: {
    data: {
      label: 'Data de nascimento',
      name: 'birthDate',
      value: null,
      max: '2026-10-11',
      isRequired: true,
    },
    ui: { startYear: 1990 },
  },
};

export const WithValue: Story = {
  args: { data: { label: 'Data de nascimento', name: 'birthDate', value: '1990-03-25' } },
};

/** Com limite: digitar uma data fora da faixa mostra o aviso ao sair do campo. */
export const WithLimits: Story = {
  args: {
    data: {
      label: 'Data da entrega',
      name: 'deliveryDate',
      value: '2026-10-15',
      min: '2026-10-10',
      max: '2026-11-20',
    },
  },
};

/** Erro vindo de fora, como o do formulário que recusou o envio. */
export const WithError: Story = {
  args: {
    data: { label: 'Data de nascimento', name: 'birthDate', value: null, isRequired: true },
    state: { error: 'Informe a data de nascimento.' },
  },
};

export const Disabled: Story = {
  args: {
    data: { label: 'Data de nascimento', name: 'birthDate', value: '1990-03-25' },
    state: { isDisabled: true },
  },
};

/** Caso limite: campo estreito — a data e o botão continuam cabendo. */
export const NarrowField: Story = {
  args: {
    data: { label: 'Data', name: 'date', value: '1990-03-25' },
    ui: { className: 'w-36' },
  },
};

/** Rótulo escondido: o campo fica ao lado de um texto que já diz o que é ("desde"). O leitor de
    tela continua lendo o rótulo. */
export const HiddenLabel: Story = {
  args: {
    data: { label: 'Entrega por e-mail desde', name: 'emailSince', value: '2024-01-15' },
    ui: { isLabelHidden: true, className: 'w-40' },
  },
};
