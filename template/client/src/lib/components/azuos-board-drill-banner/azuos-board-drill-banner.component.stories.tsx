import { type Meta, type StoryObj } from '@storybook/react';
import { fn } from 'storybook/test';

import { AzuosBoardDrillBanner } from './azuos-board-drill-banner.component';

const meta = {
  title: 'Feedback/AzuosBoardDrillBanner',
  component: AzuosBoardDrillBanner,
  args: {
    data: {
      summary: ['Tarefas por status', 'Status: Concluída', 'Últimos 30 dias'],
      notice: null,
    },
    actions: { onClear: fn(), onBack: fn() },
  },
} satisfies Meta<typeof AzuosBoardDrillBanner>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** Um bloco cruzado, com o filtro salvo e a pessoa do painel: o recorte quebra linha. */
export const LongCut: Story = {
  args: {
    data: {
      summary: [
        'Movimento da semana, por pessoa',
        'Quem fez: Leyla Braz',
        'Atualização ou conclusão: Conclusões',
        'Últimos 7 dias',
        'Pessoa: Leyla Braz',
        'Grupo: GRUPO EXEMPLO',
        'Filtro: Meus em andamento',
      ],
      notice: null,
    },
  },
};

/** O filtro salvo do recorte sumiu: a tela abriu sem ele, e avisa. */
export const FilterGone: Story = {
  args: {
    data: {
      summary: [],
      notice: 'O filtro salvo deste recorte do painel não existe mais: a tela abriu sem o recorte.',
    },
  },
};
