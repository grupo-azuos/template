import { type Meta, type StoryObj } from '@storybook/react';
import { Search } from 'lucide-react';
import { fn } from 'storybook/test';

import { AzuosInputGroup } from './azuos-input-group.component';

const meta = {
  title: 'Formulários/AzuosInputGroup',
  component: AzuosInputGroup,
  args: { actions: { onChange: fn(), onBlur: fn() } },
} satisfies Meta<typeof AzuosInputGroup>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    data: { label: 'Buscar', name: 'search', value: '', placeholder: 'Título da tarefa' },
    prefix: <Search className="size-4" aria-hidden="true" />,
    ui: { className: 'w-72' },
  },
};

/** Prefixo de texto: a unidade fica fora do campo, e não dentro do que a pessoa digita. */
export const WithTextPrefix: Story = {
  args: {
    data: { label: 'Orçamento', name: 'budget', value: '1840' },
    prefix: <span className="text-sm">R$</span>,
    ui: { className: 'w-56' },
  },
};

export const WithSuffix: Story = {
  args: {
    data: { label: 'Peso', name: 'weight', value: '12' },
    suffix: <span className="text-sm">kg</span>,
    ui: { className: 'w-56' },
  },
};

export const WithBothSides: Story = {
  args: {
    data: { label: 'Meta do mês', name: 'goal', value: '2500' },
    prefix: <span className="text-sm">R$</span>,
    suffix: <span className="text-sm">/mês</span>,
    ui: { className: 'w-64' },
  },
};

/** O erro fica colado no campo, e a borda muda junto. */
export const WithError: Story = {
  args: {
    data: { label: 'Orçamento', name: 'budget', value: 'abc' },
    prefix: <span className="text-sm">R$</span>,
    state: { error: 'Informe um número.' },
    ui: { className: 'w-56' },
  },
};

export const Disabled: Story = {
  args: {
    data: { label: 'Orçamento', name: 'budget', value: '1840' },
    prefix: <span className="text-sm">R$</span>,
    state: { isDisabled: true },
    ui: { className: 'w-56' },
  },
};

/** Caso limite: valor longo num campo estreito — ele rola dentro, não estoura o grupo. */
export const LongValueInNarrowField: Story = {
  args: {
    data: {
      label: 'Observação',
      name: 'note',
      value: 'Combinado por telefone com a pessoa responsável pelo contrato',
    },
    prefix: <Search className="size-4" aria-hidden="true" />,
    ui: { className: 'w-44' },
  },
};
