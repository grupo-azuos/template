import { type Meta, type StoryObj } from '@storybook/react';

import { AzuosFormSelectField } from './azuos-form-select-field.component';

const ROLES = [
  { value: 'admin', label: 'Administrador' },
  { value: 'manager', label: 'Gestor' },
  { value: 'user', label: 'Usuário' },
];

const meta = {
  title: 'Formulários/AzuosFormSelectField',
  component: AzuosFormSelectField,
} satisfies Meta<typeof AzuosFormSelectField>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { data: { label: 'Papel', value: 'user', options: ROLES } },
};

/** Numa linha de tabela: o rótulo fica só para leitor de tela. */
export const InTableRow: Story = {
  args: {
    data: { label: 'Papel de Leyla', value: 'manager', options: ROLES },
    ui: { isLabelHidden: true },
  },
};

/** Desabilitado com o motivo à vista — é a própria linha de quem está logado. */
export const DisabledWithHint: Story = {
  args: {
    data: {
      label: 'Papel',
      value: 'admin',
      options: ROLES,
      hint: 'Você não pode mudar o próprio papel.',
    },
    state: { isDisabled: true },
  },
};

export const WithError: Story = {
  args: {
    data: { label: 'Nível de acesso', value: 'admin', options: ROLES },
    state: { error: 'Gestor só libera o nível Usuário.' },
  },
};

/** Caso limite: opção longa numa coluna estreita. */
export const LongOptionInNarrowColumn: Story = {
  args: {
    data: {
      label: 'Sistema',
      value: 'a',
      options: [{ value: 'a', label: 'Controle de Alvarás e Licenças Municipais do Grupo' }],
    },
  },
  render: (args) => (
    <div className="w-48 border border-dashed border-ink-300 p-2">
      <AzuosFormSelectField {...args} />
    </div>
  ),
};
