import { type Meta, type StoryObj } from '@storybook/react';
import { CheckCircle2, Clock, ListChecks, TriangleAlert } from 'lucide-react';

import { AzuosStatCard } from '../azuos-stat-card/azuos-stat-card.component';
import { AzuosStatCardGrid } from './azuos-stat-card-grid.component';

const meta = {
  title: 'Gráficos e números/AzuosStatCardGrid',
  component: AzuosStatCardGrid,
} satisfies Meta<typeof AzuosStatCardGrid>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <AzuosStatCardGrid>
      <AzuosStatCard data={{ label: 'Total', value: 128 }} ui={{ icon: ListChecks }} />
      <AzuosStatCard data={{ label: 'A fazer', value: 41 }} ui={{ tone: 'warning', icon: Clock }} />
      <AzuosStatCard
        data={{ label: 'Concluídas', value: 74 }}
        ui={{ tone: 'success', icon: CheckCircle2 }}
      />
      <AzuosStatCard
        data={{ label: 'Atrasadas', value: 13 }}
        ui={{ tone: 'danger', icon: TriangleAlert }}
      />
    </AzuosStatCardGrid>
  ),
};

/** Dois cartões: a grade não estica os dois para ocupar a linha inteira. */
export const TwoCards: Story = {
  render: () => (
    <AzuosStatCardGrid>
      <AzuosStatCard data={{ label: 'Abertas', value: 7 }} ui={{ tone: 'info' }} />
      <AzuosStatCard data={{ label: 'Fechadas', value: 92 }} ui={{ tone: 'success' }} />
    </AzuosStatCardGrid>
  ),
};

/**
 * Caso limite: cinco cartões. A grade quebra para a linha de baixo em vez de espremer cinco
 * colunas — quatro é o limite do que se compara de relance.
 */
export const FiveCardsWrap: Story = {
  render: () => (
    <AzuosStatCardGrid>
      {['Total', 'A fazer', 'Em andamento', 'Concluídas', 'Atrasadas'].map((label, index) => (
        <AzuosStatCard key={label} data={{ label, value: (index + 1) * 11 }} />
      ))}
    </AzuosStatCardGrid>
  ),
};
