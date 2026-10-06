import { type Meta, type StoryObj } from '@storybook/react';

import { AzuosActionButton } from '../azuos-action-button/azuos-action-button.component';
import { AzuosPanelCard } from './azuos-panel-card.component';

const meta = {
  title: 'Conteúdo e marcadores/AzuosPanelCard',
  component: AzuosPanelCard,
} satisfies Meta<typeof AzuosPanelCard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    data: { title: 'Tarefas por situação' },
    children: <p className="text-sm">O conteúdo do bloco entra aqui.</p>,
  },
};

export const WithHint: Story = {
  args: {
    data: { title: 'Tarefas por situação', hint: 'Exclui as arquivadas' },
    children: <p className="text-sm">O conteúdo do bloco entra aqui.</p>,
  },
};

/** O controle de recorte fica no alto: quem lê precisa saber o corte antes de ler o número. */
export const WithTools: Story = {
  args: {
    data: { title: 'Tarefas criadas', hint: 'Por dia' },
    tools: (
      <AzuosActionButton
        data={{ label: 'Trocar período' }}
        ui={{ size: 'sm', variant: 'secondary' }}
      />
    ),
    children: <p className="text-sm">O gráfico entra aqui.</p>,
  },
};

/** Caso limite: título longo e controle juntos — empilham no celular, não se espremem. */
export const LongTitleWithTools: Story = {
  args: {
    data: {
      title: 'Tarefas concluídas por responsável no período selecionado',
      hint: 'Considera só quem tem pelo menos uma tarefa',
    },
    tools: (
      <AzuosActionButton data={{ label: 'Exportar' }} ui={{ size: 'sm', variant: 'secondary' }} />
    ),
    children: <p className="text-sm">O conteúdo do bloco entra aqui.</p>,
  },
  render: (args) => (
    <div className="w-80">
      <AzuosPanelCard {...args} />
    </div>
  ),
};
