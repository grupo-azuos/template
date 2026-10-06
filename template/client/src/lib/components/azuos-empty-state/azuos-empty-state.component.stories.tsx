import { type Meta, type StoryObj } from '@storybook/react';
import { Plus, SearchX } from 'lucide-react';

import { AzuosActionButton } from '../azuos-action-button/azuos-action-button.component';
import { AzuosEmptyState } from './azuos-empty-state.component';

const meta = {
  title: 'Estados da tela/AzuosEmptyState',
  component: AzuosEmptyState,
} satisfies Meta<typeof AzuosEmptyState>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { data: { title: 'Nenhuma tarefa ainda' } },
};

/** Com o próximo passo e a ação. É o formato preferido. */
export const WithAction: Story = {
  args: {
    data: {
      title: 'Nenhuma tarefa ainda',
      description: 'Cadastre a primeira para começar a acompanhar o trabalho.',
    },
    children: <AzuosActionButton data={{ label: 'Nova tarefa' }} ui={{ icon: Plus }} />,
  },
};

/** O filtro escondeu tudo: a saída é limpar o filtro, não cadastrar. */
export const FilteredOut: Story = {
  args: {
    data: {
      title: 'Nenhuma tarefa encontrada',
      description: 'Nada combina com a busca. Tente outro termo ou limpe os filtros.',
    },
    ui: { icon: SearchX },
    children: (
      <AzuosActionButton data={{ label: 'Limpar filtros' }} ui={{ variant: 'secondary' }} />
    ),
  },
};

/** Caso limite: descrição longa numa coluna estreita. */
export const LongDescriptionInNarrowColumn: Story = {
  args: {
    data: {
      title: 'Nenhum registro',
      description:
        'Quando alguém cadastrar o primeiro registro, ele aparece aqui com a situação, o responsável e a data em que foi criado.',
    },
  },
  render: (args) => (
    <div className="w-64">
      <AzuosEmptyState {...args} />
    </div>
  ),
};
