import { type Meta, type StoryObj } from '@storybook/react';
import { Tags } from 'lucide-react';

import { AzuosStatCard } from '../azuos-stat-card/azuos-stat-card.component';
import { AzuosCarousel } from './azuos-carousel.component';

const meta = {
  title: 'Conteúdo e marcadores/AzuosCarousel',
  component: AzuosCarousel,
} satisfies Meta<typeof AzuosCarousel>;

export default meta;

type Story = StoryObj<typeof meta>;

const LABELS = [
  'Iniciado',
  'Ag. oposição',
  'Defesa',
  'Ag. exame',
  'Ag. pagamento',
  'Ag. certificado',
  'Concluído',
  'Indeferido',
  'Arquivado',
  'Paralisado',
  'Judicial',
];

export const Default: Story = {
  args: {
    ui: { ariaLabel: 'Resumo por status', itemClassName: 'basis-1/2 md:basis-1/3 xl:basis-1/6' },
  },
  render: (args) => (
    <AzuosCarousel {...args}>
      {LABELS.map((label, index) => (
        <AzuosStatCard key={label} data={{ label, value: index * 3 }} ui={{ icon: Tags }} />
      ))}
    </AzuosCarousel>
  ),
};

/** Cartões largos: dois por vez, o resto a um arraste. */
export const WideItems: Story = {
  args: { ui: { ariaLabel: 'Indicadores', itemClassName: 'basis-1/2' } },
  render: Default.render,
};

/** Caso limite: tudo cabe — as setas ficam desligadas, não somem (a faixa não muda de largura). */
export const FitsWithoutSliding: Story = {
  args: { ui: { ariaLabel: 'Poucos indicadores', itemClassName: 'basis-1/4' } },
  render: (args) => (
    <AzuosCarousel {...args}>
      <AzuosStatCard data={{ label: 'Total', value: 12 }} ui={{ tone: 'brand', icon: Tags }} />
      <AzuosStatCard data={{ label: 'Concluído', value: 4 }} ui={{ tone: 'success', icon: Tags }} />
    </AzuosCarousel>
  ),
};

/** Caso limite: faixa vazia — só as setas, desligadas. */
export const Empty: Story = {
  args: { ui: { ariaLabel: 'Sem indicadores' } },
};
