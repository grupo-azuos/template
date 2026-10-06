import { type Meta, type StoryObj } from '@storybook/react';
import { CheckCircle2, Circle, Clock } from 'lucide-react';
import { fn } from 'storybook/test';

import { AzuosSelectField } from './azuos-select-field.component';

const meta = {
  title: 'Formulários/AzuosSelectField',
  component: AzuosSelectField,
  decorators: [
    (Story) => (
      <div className="w-56">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof AzuosSelectField>;

export default meta;

type Story = StoryObj<typeof meta>;

const owners = [
  { value: '', label: 'Todos os responsáveis' },
  { value: 'Ana', label: 'Ana' },
  { value: 'Bia', label: 'Bia' },
];

export const Default: Story = {
  args: {
    data: { value: '', options: owners },
    ui: { ariaLabel: 'Responsável', placeholder: 'Todos os responsáveis' },
    actions: { onChange: fn() },
  },
};

export const WithValueSelected: Story = {
  args: { ...Default.args, data: { value: 'Ana', options: owners } },
};

export const Disabled: Story = {
  args: { ...Default.args, state: { isDisabled: true } },
};

/** Caso limite: lista de opções longa o bastante para rolar dentro do menu. */
export const ManyOptions: Story = {
  args: {
    ...Default.args,
    data: {
      value: '',
      options: [
        { value: '', label: 'Todos' },
        ...Array.from({ length: 20 }, (_, index) => ({
          value: `opcao-${index}`,
          label: `Opção ${index + 1}`,
        })),
      ],
    },
  },
};

/** Com ícone: o desenho aparece no gatilho e em cada linha da lista. */
export const WithIcons: Story = {
  args: {
    data: {
      value: 'in_progress',
      options: [
        { value: 'todo', label: 'A fazer', icon: Circle },
        { value: 'in_progress', label: 'Em andamento', icon: Clock },
        { value: 'done', label: 'Concluída', icon: CheckCircle2 },
      ],
    },
    ui: { ariaLabel: 'Situação' },
    actions: { onChange: fn() },
  },
};
