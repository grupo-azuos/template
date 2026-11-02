import { type Meta, type StoryObj } from '@storybook/react';
import { fn } from 'storybook/test';

import { AzuosSuggestionTextField } from './azuos-suggestion-text-field.component';

const departments = ['Administrativo', 'Financeiro', 'Jurídico', 'Recursos Humanos'];

const meta = {
  title: 'Formulários/AzuosSuggestionTextField',
  component: AzuosSuggestionTextField,
  decorators: [
    (Story) => (
      <div className="h-80 w-72">
        <Story />
      </div>
    ),
  ],
  args: {
    data: {
      label: 'Departamento',
      name: 'department',
      value: '',
      options: departments,
      placeholder: 'Pesquisar departamento',
      emptyMessage: 'Nada cadastrado ainda. Use Configurações › Cadastro.',
    },
    actions: { onChange: fn(), onBlur: fn() },
  },
} satisfies Meta<typeof AzuosSuggestionTextField>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Clique no campo: a lista inteira abre. */
export const Default: Story = {};

export const Filled: Story = {
  args: { data: { ...meta.args.data, value: 'Financeiro' } },
};

export const Required: Story = {
  args: { state: { isRequired: true } },
};

export const WithError: Story = {
  args: { state: { isRequired: true, error: 'Informe o departamento' } },
};

export const Disabled: Story = {
  args: { data: { ...meta.args.data, value: 'Financeiro' }, state: { isDisabled: true } },
};

/** Nada cadastrado: a lista diz onde cadastrar. */
export const NothingRegistered: Story = {
  args: { data: { ...meta.args.data, options: [] } },
};

/** Caso limite: opção enorme e lista que rola. */
export const LongOptionsAndManyItems: Story = {
  args: {
    data: {
      ...meta.args.data,
      options: [
        'Departamento de Planejamento Estratégico e Relações Institucionais com Filiais',
        ...Array.from({ length: 25 }, (_, index) => `Filial ${index + 1}`),
      ],
    },
  },
};
