import { type Meta, type StoryObj } from '@storybook/react';
import { Plus, Trash2 } from 'lucide-react';
import { fn } from 'storybook/test';

import { AzuosActionButton } from './azuos-action-button.component';

const meta = {
  title: 'Ações/AzuosActionButton',
  component: AzuosActionButton,
  args: { actions: { onClick: fn() } },
} satisfies Meta<typeof AzuosActionButton>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { data: { label: 'Nova tarefa' }, ui: { icon: Plus } },
};

export const AllVariants: Story = {
  args: { data: { label: 'Salvar' } },
  render: () => (
    <div className="flex flex-wrap gap-2">
      <AzuosActionButton data={{ label: 'Primário' }} ui={{ variant: 'primary' }} />
      <AzuosActionButton data={{ label: 'Secundário' }} ui={{ variant: 'secondary' }} />
      <AzuosActionButton data={{ label: 'Discreto' }} ui={{ variant: 'ghost' }} />
      <AzuosActionButton data={{ label: 'Excluir' }} ui={{ variant: 'danger', icon: Trash2 }} />
    </div>
  ),
};

export const Small: Story = {
  args: { data: { label: 'Editar' }, ui: { size: 'sm', variant: 'secondary' } },
};

/** Só ícone: o rótulo vira `aria-label` — o leitor de tela continua sabendo o que é. */
export const IconOnly: Story = {
  args: {
    data: { label: 'Excluir tarefa' },
    ui: { icon: Trash2, isIconOnly: true, variant: 'ghost' },
  },
};

/** Carregando: trava e gira. Dois cliques seriam duas requisições. */
export const Loading: Story = {
  args: {
    data: { label: 'Excluir', loadingLabel: 'Excluindo…' },
    ui: { variant: 'danger', icon: Trash2 },
    state: { isLoading: true },
  },
};

export const Disabled: Story = {
  args: { data: { label: 'Nova tarefa' }, ui: { icon: Plus }, state: { isDisabled: true } },
};

/** Caso limite: rótulo longo numa coluna estreita. */
export const LongLabelInNarrowColumn: Story = {
  args: { data: { label: 'Exportar todas as tarefas concluídas do mês' } },
  render: (args) => (
    <div className="border-ink-300 w-48 border border-dashed p-2">
      <AzuosActionButton {...args} />
    </div>
  ),
};

/**
 * Os três degraus da régua de medidas (`lib/theme/tokens.css`): `sm` dentro de uma linha de
 * tabela, `md` para a ação da tela, `lg` quando o botão divide fileira com um campo.
 */
export const AllSizes: Story = {
  args: { data: { label: 'Salvar' } },
  render: () => (
    <div className="flex flex-wrap items-center gap-2">
      <AzuosActionButton data={{ label: 'Pequeno (32px)' }} ui={{ size: 'sm' }} />
      <AzuosActionButton data={{ label: 'Médio (36px)' }} ui={{ size: 'md' }} />
      <AzuosActionButton data={{ label: 'Grande (40px)' }} ui={{ size: 'lg' }} />
    </div>
  ),
};

/** Ligado/desligado: `aria-pressed` anuncia qual está valendo, não só a cor. */
export const Pressed: Story = {
  args: {
    data: { label: 'Mostrar concluídas' },
    ui: { variant: 'secondary' },
    state: { isPressed: true },
  },
};
