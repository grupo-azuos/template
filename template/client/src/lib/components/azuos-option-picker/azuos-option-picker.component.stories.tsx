import { type Meta, type StoryObj } from '@storybook/react';
import { CheckCircle2, Circle, Clock } from 'lucide-react';
import { fn } from 'storybook/test';

import { AzuosOptionPicker } from './azuos-option-picker.component';

const meta = {
  title: 'Formulários/AzuosOptionPicker',
  component: AzuosOptionPicker,
  args: { actions: { onChange: fn() } },
} satisfies Meta<typeof AzuosOptionPicker>;

export default meta;

type Story = StoryObj<typeof meta>;

const STATUS = [
  { value: 'todo', label: 'A fazer', tone: 'neutral' as const, icon: Circle },
  { value: 'in_progress', label: 'Em andamento', tone: 'info' as const, icon: Clock },
  { value: 'done', label: 'Concluída', tone: 'success' as const, icon: CheckCircle2 },
];

const MANY = Array.from({ length: 14 }, (_, index) => ({
  value: 'dept-' + index,
  label: 'Departamento ' + (index + 1),
}));

/** Poucas opções: pastilhas num trilho — compara e troca com um clique, sem abrir nada. */
export const Default: Story = {
  args: {
    data: { value: 'in_progress', options: STATUS },
    ui: { ariaLabel: 'Situação', allLabel: 'Todas' },
  },
};

/** Sem a opção "Todas": é assim num formulário, onde escolher é obrigatório. */
export const WithoutAll: Story = {
  args: { data: { value: 'todo', options: STATUS }, ui: { ariaLabel: 'Situação' } },
};

/**
 * Em formulário (`fullWidth`): as pastilhas dividem a largura do campo em colunas iguais, numa
 * linha só. A altura continua a de todo campo — 40px.
 */
export const InAForm: Story = {
  args: {
    data: { value: 'done', options: STATUS },
    ui: { ariaLabel: 'Situação', fullWidth: true },
  },
  render: (args) => (
    <div className="w-72">
      <AzuosOptionPicker {...args} />
    </div>
  ),
};

/** Muitas opções: vira um botão que abre a lista com busca — pastilha viraria uma parede. */
export const ManyOptions: Story = {
  args: {
    data: { value: 'dept-3', options: MANY },
    ui: { ariaLabel: 'Departamento', allLabel: 'Todos' },
  },
};

export const Disabled: Story = {
  args: {
    data: { value: 'todo', options: STATUS },
    ui: { ariaLabel: 'Situação' },
    state: { isDisabled: true },
  },
};

/** Caso limite: valor que não está entre as opções — nenhuma pastilha fica marcada. */
export const ValueOutsideTheOptions: Story = {
  args: { data: { value: 'archived', options: STATUS }, ui: { ariaLabel: 'Situação' } },
};
