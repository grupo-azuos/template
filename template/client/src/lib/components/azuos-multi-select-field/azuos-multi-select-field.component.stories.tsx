import { type Meta, type StoryObj } from '@storybook/react';
import { fn } from 'storybook/test';

import { AzuosMultiSelectField } from './azuos-multi-select-field.component';

const OPTIONS = [
  { value: 'simples', label: 'Simples Nacional' },
  { value: 'presumido', label: 'Lucro Presumido' },
  { value: 'real', label: 'Lucro Real' },
  { value: 'mei', label: 'MEI' },
];

const meta = {
  title: 'Formulários/AzuosMultiSelectField',
  component: AzuosMultiSelectField,
  args: {
    data: { values: [], options: OPTIONS, placeholder: 'Todos os regimes', noun: 'regimes' },
    ui: { ariaLabel: 'Regime', className: 'max-w-72' },
    actions: { onChange: fn() },
  },
} satisfies Meta<typeof AzuosMultiSelectField>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const TwoSelected: Story = {
  args: {
    data: {
      values: ['simples', 'real'],
      options: OPTIONS,
      placeholder: 'Todos os regimes',
      noun: 'regimes',
    },
  },
};

export const ManySelected: Story = {
  args: {
    data: {
      values: ['simples', 'real', 'mei'],
      options: OPTIONS,
      placeholder: 'Todos os regimes',
      noun: 'regimes',
    },
  },
};

export const Disabled: Story = { args: { state: { isDisabled: true } } };

/** Pessoas inventadas: duas com foto e uma sem, que fica com as iniciais. */
const people = [
  {
    value: 'ana',
    label: 'Ana Souza',
    personName: 'Ana Souza',
    avatarUrl: 'https://i.pravatar.cc/64?img=5',
  },
  { value: 'caio', label: 'Caio Ribeiro', personName: 'Caio Ribeiro', avatarUrl: null },
  {
    value: 'dani',
    label: 'Dani Albuquerque',
    personName: 'Dani Albuquerque',
    avatarUrl: 'https://i.pravatar.cc/64?img=9',
  },
];

/** Seletor de pessoas: os rostos de quem está marcado no botão, e a foto em cada linha. */
export const WithPeople: Story = {
  args: {
    data: {
      values: ['ana', 'caio'],
      options: people,
      placeholder: 'Todos os responsáveis',
      noun: 'pessoas',
    },
    ui: { ariaLabel: 'Responsáveis', className: 'max-w-72' },
  },
};
