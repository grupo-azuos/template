import { type Meta, type StoryObj } from '@storybook/react';
import { fn } from 'storybook/test';

import { AzuosSegmentedControl } from './azuos-segmented-control.component';

const options = [
  { value: 'all', label: 'Todas as empresas' },
  { value: 'missing_documents', label: 'Faltam documentos' },
  { value: 'missing_statements', label: 'Faltam extratos' },
  { value: 'ready_to_conclude', label: 'Prontas para concluir' },
  { value: 'concluded', label: 'Ano em dia' },
];

const meta = {
  title: 'Formulários/AzuosSegmentedControl',
  component: AzuosSegmentedControl,
  args: {
    data: { value: 'all', options },
    ui: { ariaLabel: 'Recorte' },
    actions: { onChange: fn() },
  },
} satisfies Meta<typeof AzuosSegmentedControl>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const OtherOptionOn: Story = {
  args: { data: { value: 'ready_to_conclude', options } },
};

export const Disabled: Story = {
  args: { state: { isDisabled: true } },
};

/** Caso limite: duas opções só. */
export const TwoOptions: Story = {
  args: { data: { value: 'all', options: options.slice(0, 2) } },
};

/** Caso limite: tela de celular — os botões quebram linha, a página não rola de lado. */
export const OnPhone: Story = {
  render: (args) => (
    <div className="w-[360px]">
      <AzuosSegmentedControl {...args} />
    </div>
  ),
};
