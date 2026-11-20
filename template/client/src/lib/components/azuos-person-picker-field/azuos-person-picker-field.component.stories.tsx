import { type Meta, type StoryObj } from '@storybook/react';
import { fn } from 'storybook/test';

import { AzuosPersonPickerField } from './azuos-person-picker-field.component';

const PEOPLE = [
  { id: 'u-ana', name: 'Ana Souza', photo: null },
  { id: 'u-bia', name: 'Bia Marques', photo: null },
  { id: 'u-caio', name: 'Caio Ribeiro', photo: null },
];

const meta = {
  title: 'Formulários/AzuosPersonPickerField',
  component: AzuosPersonPickerField,
  decorators: [
    (Story) => (
      <div className="w-72">
        <Story />
      </div>
    ),
  ],
  args: {
    data: { value: '', people: PEOPLE },
    ui: { ariaLabel: 'Responsável' },
    actions: { onChange: fn() },
  },
} satisfies Meta<typeof AzuosPersonPickerField>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Chosen: Story = { args: { data: { value: 'u-bia', people: PEOPLE } } };

export const WithLeadingOptions: Story = {
  args: {
    data: {
      value: '',
      people: PEOPLE,
      leading: [
        { value: '', label: 'Todas as pessoas' },
        { value: '@me', label: 'Eu' },
      ],
    },
    ui: { ariaLabel: 'Pessoa', placeholder: 'Todas as pessoas' },
  },
};

export const Disabled: Story = { args: { state: { isDisabled: true } } };

export const NobodyYet: Story = { args: { data: { value: '', people: [] } } };
