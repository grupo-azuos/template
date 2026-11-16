import { type Meta, type StoryObj } from '@storybook/react';
import { BellOff, CalendarX, CircleHelp, UserX } from 'lucide-react';

import { AzuosPersonScoreCard } from './azuos-person-score-card.component';

const meta = {
  title: 'Gráficos e números/AzuosPersonScoreCard',
  component: AzuosPersonScoreCard,
  decorators: [
    (Story) => (
      <div className="max-w-md">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof AzuosPersonScoreCard>;

export default meta;
type Story = StoryObj<typeof meta>;

const metrics = (missing: number, overdue: number, noStatus: number) => [
  { key: 'missing', label: 'Sem próxima', count: missing, icon: CalendarX },
  { key: 'overdue', label: 'Vencidos', count: overdue, icon: BellOff },
  { key: 'no-status', label: 'Sem status', count: noStatus, icon: CircleHelp },
];

/** Verde: a carteira está em dia, e os selos zerados ficam neutros. */
export const Default: Story = {
  args: {
    data: {
      name: 'Pessoa Exemplo',
      subtitle: '177 alvarás ativos',
      score: 98,
      metrics: metrics(0, 4, 0),
      actionLabel: 'Ver alvarás',
    },
    actions: { onOpen: () => undefined },
  },
};

/** Amarelo: o anel no amarelo do grupo, e o número no tom legível. */
export const Fair: Story = {
  args: {
    data: {
      name: 'Outra Pessoa',
      subtitle: '370 alvarás ativos',
      score: 93,
      metrics: metrics(11, 17, 0),
      actionLabel: 'Ver alvarás',
    },
    actions: { onOpen: () => undefined },
  },
};

export const Poor: Story = {
  args: {
    data: { name: 'Mais Uma', subtitle: '40 alvarás ativos', score: 83, metrics: metrics(7, 0, 0) },
  },
};

/** A linha que não é uma pessoa: o ícone no lugar do rosto. */
export const Placeholder: Story = {
  args: {
    data: {
      name: 'Sem responsável',
      subtitle: '9 alvarás ativos',
      score: 100,
      metrics: metrics(0, 0, 0),
    },
    ui: { placeholderIcon: UserX },
  },
};

/** Caso limite: nome comprido e nenhum selo. */
export const LongNameNoMetrics: Story = {
  args: {
    data: {
      name: 'Nome Muito Comprido De Uma Pessoa Que Não Cabe Na Linha Inteira',
      score: 0,
      metrics: [],
    },
  },
};
