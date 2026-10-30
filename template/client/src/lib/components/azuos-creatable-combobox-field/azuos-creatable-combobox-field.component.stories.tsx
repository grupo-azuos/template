import { type Meta, type StoryObj } from '@storybook/react';
import { fn } from 'storybook/test';

import { AzuosCreatableComboboxField } from './azuos-creatable-combobox-field.component';

const meta = {
  title: 'Formulários/AzuosCreatableComboboxField',
  component: AzuosCreatableComboboxField,
  decorators: [
    (Story) => (
      <div className="w-64">
        <Story />
      </div>
    ),
  ],
  args: {
    data: { value: '', options: ['Anápolis', 'Aparecida de Goiânia', 'Goiânia', 'Trindade'] },
    ui: {
      ariaLabel: 'Cidade',
      placeholder: 'Selecione...',
      searchPlaceholder: 'Buscar cidade...',
      clearLabel: 'Sem cidade',
    },
    actions: { onChange: fn(), onSearch: fn(), onCreate: fn() },
  },
} satisfies Meta<typeof AzuosCreatableComboboxField>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithValueSelected: Story = {
  args: { data: { value: 'Goiânia', options: ['Goiânia', 'Trindade'] } },
};

/** Busca a caminho: o indicador gira e a opção "Cadastrar" espera a resposta. */
export const Searching: Story = {
  args: { state: { isLoading: true } },
};

/** A cidade escolhida em "Cadastrar" está sendo gravada. */
export const Creating: Story = {
  args: { data: { value: 'Senador Canedo', options: [] }, state: { isCreating: true } },
};

export const Disabled: Story = {
  args: { state: { isDisabled: true } },
};

/** Vazio: nenhuma cidade cadastrada ainda — a lista convida a digitar. */
export const Empty: Story = {
  args: { data: { value: '', options: [] } },
};

/** Caso limite: nome longo que precisa cortar no gatilho em vez de empurrar a seta. */
export const LongValue: Story = {
  args: {
    data: {
      value: 'São Miguel do Passa Quatro de Todos os Santos da Serra Dourada',
      options: [],
    },
  },
};
