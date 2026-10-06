import { type Meta, type StoryObj } from '@storybook/react';
import { Building2, User } from 'lucide-react';
import { fn } from 'storybook/test';

import { AzuosComboboxField } from './azuos-combobox-field.component';

/**
 * As duas variantes do campo estão aqui: `Default` é só pesquisa, `WithCreate` é pesquisa mais a
 * saída de criar o que não existe. A diferença entre elas é uma ação a mais, não um modo.
 */
const meta = {
  title: 'Formulários/AzuosComboboxField',
  component: AzuosComboboxField,
  decorators: [
    (Story) => (
      <div className="w-72">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof AzuosComboboxField>;

export default meta;

type Story = StoryObj<typeof meta>;

const owners = [
  { value: 'ana', label: 'Ana Souza' },
  { value: 'bia', label: 'Bia Marques' },
  { value: 'caio', label: 'Caio Ribeiro' },
  { value: 'dani', label: 'Dani Albuquerque' },
  { value: 'edu', label: 'Edu Nogueira' },
];

const tags = [
  { value: 'urgente', label: 'Urgente' },
  { value: 'cliente-novo', label: 'Cliente novo' },
  { value: 'financeiro', label: 'Financeiro' },
];

/** Só pesquisa: o catálogo é fechado, a pessoa escolhe de quem já existe. */
export const Default: Story = {
  args: {
    data: { value: '', options: owners },
    ui: {
      ariaLabel: 'Responsável',
      placeholder: 'Escolha o responsável',
      searchPlaceholder: 'Pesquisar pessoa…',
      emptyLabel: 'Ninguém com esse nome.',
    },
    actions: { onChange: fn() },
  },
};

/** Pesquisa mais criação: digitou uma etiqueta que não existe, a lista oferece criá-la. */
export const WithCreate: Story = {
  args: {
    data: { value: '', options: tags },
    ui: {
      ariaLabel: 'Etiqueta',
      placeholder: 'Escolha ou crie uma etiqueta',
      searchPlaceholder: 'Pesquisar ou digitar nova…',
      emptyLabel: 'Nenhuma etiqueta com esse nome.',
      createLabel: 'Criar etiqueta',
    },
    actions: { onChange: fn(), onCreate: fn() },
  },
};

/** Com valor escolhido: o gatilho mostra o rótulo, e a lista aberta traz o "visto" na linha. */
export const WithValueSelected: Story = {
  args: { ...Default.args, data: { value: 'caio', options: owners } },
};

/** Com ícone por opção, para quando o tipo da coisa ajuda mais que o nome. */
export const WithIcons: Story = {
  args: {
    ...Default.args,
    data: {
      value: '',
      options: [
        { value: 'ana', label: 'Ana Souza', icon: User },
        { value: 'bia', label: 'Bia Marques', icon: User },
        { value: 'matriz', label: 'Matriz — São Paulo', icon: Building2 },
      ],
    },
  },
};

/** Desabilitado: não abre, e o campo fica apagado. */
export const Disabled: Story = {
  args: { ...Default.args, state: { isDisabled: true } },
};

/** Lista comprida: é exatamente o caso que justifica a busca existir. */
export const ManyOptions: Story = {
  args: {
    ...Default.args,
    data: {
      value: '',
      options: Array.from({ length: 60 }, (_, index) => ({
        value: `cliente-${index + 1}`,
        label: `Cliente ${String(index + 1).padStart(3, '0')} — Comércio de Alimentos`,
      })),
    },
  },
};

/** Caso limite: nome muito longo em campo estreito — corta o texto, não empurra a tela. */
export const LongLabelInNarrowColumn: Story = {
  decorators: [
    (Story) => (
      <div className="w-44">
        <Story />
      </div>
    ),
  ],
  args: {
    ...Default.args,
    data: {
      value: 'longo',
      options: [
        {
          value: 'longo',
          label: 'Distribuidora de Materiais de Construção do Vale do Paraíba Ltda. — Filial II',
        },
      ],
    },
  },
};
