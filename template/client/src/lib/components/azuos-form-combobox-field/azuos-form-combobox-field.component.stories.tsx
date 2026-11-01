import { type Meta, type StoryObj } from '@storybook/react';
import { fn } from 'storybook/test';

import { AzuosFormComboboxField } from './azuos-form-combobox-field.component';

const JOB_TITLES = [
  { value: '', label: 'Nenhum' },
  { value: 'Analista contábil', label: 'Analista contábil' },
  { value: 'Assistente fiscal', label: 'Assistente fiscal' },
  { value: 'Coordenadora de departamento pessoal', label: 'Coordenadora de departamento pessoal' },
  { value: 'Supervisor', label: 'Supervisor' },
];

const meta = {
  title: 'Formulários/AzuosFormComboboxField',
  component: AzuosFormComboboxField,
  args: { actions: { onChange: fn(), onBlur: fn() } },
} satisfies Meta<typeof AzuosFormComboboxField>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { data: { label: 'Cargo', value: 'Analista contábil', options: JOB_TITLES } },
};

export const Empty: Story = {
  args: { data: { label: 'Cargo', value: '', options: JOB_TITLES } },
};

/** A lista do RH não veio: só o valor atual, com o porquê embaixo. */
export const OptionsUnavailable: Story = {
  args: {
    data: {
      label: 'Departamento',
      value: 'Fiscal',
      options: [
        { value: '', label: 'Nenhum' },
        { value: 'Fiscal', label: 'Fiscal' },
      ],
      hint: 'Não consegui carregar a lista do RH agora. O valor atual continua salvo.',
    },
  },
};

export const Disabled: Story = {
  args: {
    data: {
      label: 'Cargo',
      value: 'Supervisor',
      options: JOB_TITLES,
      hint: 'Cargo e departamento são atualizados pelo RH.',
    },
    state: { isDisabled: true },
  },
};

export const WithError: Story = {
  args: {
    data: { label: 'Cargo', value: '', options: JOB_TITLES },
    state: { error: 'O cargo pode ter no máximo 120 caracteres' },
  },
};

/** Nome comprido: o gatilho corta, a tela não vaza. */
export const LongValue: Story = {
  args: {
    data: {
      label: 'Cargo',
      value: 'Coordenadora de departamento pessoal',
      options: JOB_TITLES,
    },
    ui: { className: 'w-56' },
  },
};
