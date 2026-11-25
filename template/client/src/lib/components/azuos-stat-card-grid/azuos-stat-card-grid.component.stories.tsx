import { type Meta, type StoryObj } from '@storybook/react';
import { CheckCircle2, Clock, ListChecks, TriangleAlert } from 'lucide-react';

import { AzuosContentCard } from '../azuos-content-card/azuos-content-card.component';
import { AzuosStatCardGrid } from './azuos-stat-card-grid.component';

const meta = {
  title: 'Cards/AzuosStatCardGrid',
  component: AzuosStatCardGrid,
} satisfies Meta<typeof AzuosStatCardGrid>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <AzuosStatCardGrid>
      <AzuosContentCard
        data={{ label: 'Total', title: 'Total', highlight: { value: 128 } }}
        ui={{ icon: ListChecks }}
      />
      <AzuosContentCard
        data={{ label: 'A fazer', title: 'A fazer', highlight: { value: 41 } }}
        ui={{ icon: Clock, iconTone: 'yellow' }}
      />
      <AzuosContentCard
        data={{ label: 'Concluídas', title: 'Concluídas', highlight: { value: 74 } }}
        ui={{ icon: CheckCircle2, iconTone: 'green' }}
      />
      <AzuosContentCard
        data={{ label: 'Atrasadas', title: 'Atrasadas', highlight: { value: 13 } }}
        ui={{ icon: TriangleAlert, iconTone: 'red' }}
      />
    </AzuosStatCardGrid>
  ),
};

/** Dois cartões: a grade não estica os dois para ocupar a linha inteira. */
export const TwoCards: Story = {
  render: () => (
    <AzuosStatCardGrid>
      <AzuosContentCard
        data={{ label: 'Abertas', title: 'Abertas', highlight: { value: 7 } }}
        ui={{ iconTone: 'blue' }}
      />
      <AzuosContentCard
        data={{ label: 'Fechadas', title: 'Fechadas', highlight: { value: 92 } }}
        ui={{ iconTone: 'green' }}
      />
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
        <AzuosContentCard
          key={label}
          data={{ label: label, title: label, highlight: { value: (index + 1) * 11 } }}
        />
      ))}
    </AzuosStatCardGrid>
  ),
};
