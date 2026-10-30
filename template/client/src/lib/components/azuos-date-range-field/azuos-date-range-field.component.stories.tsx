import { type Meta, type StoryObj } from '@storybook/react';
import { useState } from 'react';
import { fn } from 'storybook/test';

import {
  AzuosDateRangeField,
  type AzuosDateRangeFieldProps,
} from './azuos-date-range-field.component';

/**
 * As histórias guardam o valor de verdade: sem isso o campo voltaria ao valor inicial depois do
 * "Aplicar", e não daria para ver o período escolhido no campo fechado.
 */
function StatefulDateRangeField(args: AzuosDateRangeFieldProps) {
  const [value, setValue] = useState(args.data.value);

  return (
    <div className="flex w-80 flex-col gap-2">
      <AzuosDateRangeField
        {...args}
        data={{ ...args.data, value }}
        actions={{
          onChange: (next) => {
            setValue(next);
            args.actions.onChange(next);
          },
        }}
      />
      <p className="text-ink-500 text-xs">
        Valor entregue: {value.from ?? 'nenhum'} → {value.to ?? 'nenhum'}
      </p>
    </div>
  );
}

const meta = {
  title: 'Formulários/AzuosDateRangeField',
  component: AzuosDateRangeField,
  args: { actions: { onChange: fn() } },
  render: (args) => <StatefulDateRangeField {...args} />,
} satisfies Meta<typeof AzuosDateRangeField>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Vazio: toque no campo, escolha as duas datas (ou digite em "De" e "Até") e aplique. */
export const Default: Story = {
  args: { data: { label: 'Período', name: 'period', value: { from: null, to: null } } },
};

export const WithValue: Story = {
  args: {
    data: {
      label: 'Período',
      name: 'period',
      value: { from: '2026-03-01', to: '2026-03-31' },
    },
  },
};

/** Período que atravessa a virada do ano: cada calendário mostra o seu mês e o seu ano. */
export const AcrossYears: Story = {
  args: {
    data: {
      label: 'Período do comparativo',
      name: 'comparison',
      value: { from: '2025-12-15', to: '2026-01-20' },
    },
  },
};

/** Com limite: os dias fora da faixa ficam apagados e os seletores não saem dela. */
export const WithLimits: Story = {
  args: {
    data: {
      label: 'Período',
      name: 'period',
      value: { from: null, to: null },
      min: '2026-01-01',
      max: '2026-12-31',
    },
  },
};

export const WithError: Story = {
  args: {
    data: { label: 'Período', name: 'period', value: { from: null, to: null } },
    state: { error: 'Informe o período do relatório.' },
  },
};

export const Disabled: Story = {
  args: {
    data: {
      label: 'Período',
      name: 'period',
      value: { from: '2026-03-01', to: '2026-03-31' },
    },
    state: { isDisabled: true },
  },
};

/** Caso limite: campo estreito — o período corta em vez de estourar a largura. */
export const NarrowField: Story = {
  args: {
    data: {
      label: 'Período',
      name: 'period',
      value: { from: '2026-03-01', to: '2026-03-31' },
    },
    ui: { className: 'w-40' },
  },
};
