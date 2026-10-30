import { type Meta, type StoryObj } from '@storybook/react';
import { fn } from 'storybook/test';

import { AzuosMonthPickerField } from './azuos-month-picker-field.component';

const meta = {
  title: 'Formulários/AzuosMonthPickerField',
  component: AzuosMonthPickerField,
  decorators: [
    (Story) => (
      <div className="w-56">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof AzuosMonthPickerField>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Como FILTRO de lista: sem rótulo visível, só o nome para o leitor de tela. */
export const Default: Story = {
  args: {
    data: { value: '' },
    ui: { ariaLabel: 'Mês do calendário', placeholder: 'Todos os meses' },
    actions: { onChange: fn() },
  },
};

export const WithMonthChosen: Story = {
  args: { ...Default.args, data: { value: '2026-10' } },
};

export const Disabled: Story = {
  args: { ...Default.args, state: { isDisabled: true } },
};

/** Como CAMPO de formulário: rótulo em cima e asterisco de obrigatório. */
export const AsFormField: Story = {
  args: {
    data: { value: '2026-03', label: 'Mês de competência', name: 'month' },
    state: { isRequired: true },
    actions: { onChange: fn() },
  },
};

/** Campo recusado: o erro colado embaixo, e a borda vermelha. */
export const FormFieldWithError: Story = {
  args: {
    ...AsFormField.args,
    data: { value: '', label: 'Mês de competência', name: 'month' },
    state: { isRequired: true, error: 'Informe o mês' },
  },
};

/** Caso limite: mês que não existe, vindo de uma importação. */
export const ImpossibleMonth: Story = {
  args: {
    data: { value: '2026-13', label: 'Mês de competência' },
    ui: { placeholder: 'Escolher mês' },
    actions: { onChange: fn() },
  },
};
