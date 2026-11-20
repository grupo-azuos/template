import { type Meta, type StoryObj } from '@storybook/react';
import { fn } from 'storybook/test';

import { AzuosPersonMultiPickerField } from './azuos-person-multi-picker-field.component';

const PEOPLE = [
  { id: 'u-ana', name: 'Ana Souza', photo: null },
  { id: 'u-bia', name: 'Bia Marques', photo: null },
  { id: 'u-caio', name: 'Caio Ribeiro', photo: null },
];

const meta = {
  title: 'Formulários/AzuosPersonMultiPickerField',
  component: AzuosPersonMultiPickerField,
  decorators: [
    (Story) => (
      <div className="w-72">
        <Story />
      </div>
    ),
  ],
  args: {
    data: { values: [], people: PEOPLE },
    ui: { ariaLabel: 'Envolvidos' },
    actions: { onChange: fn() },
  },
} satisfies Meta<typeof AzuosPersonMultiPickerField>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const TwoChosen: Story = { args: { data: { values: ['u-ana', 'u-bia'], people: PEOPLE } } };

export const ManyChosen: Story = {
  args: { data: { values: ['u-ana', 'u-bia', 'u-caio'], people: PEOPLE } },
};

export const Disabled: Story = { args: { state: { isDisabled: true } } };
