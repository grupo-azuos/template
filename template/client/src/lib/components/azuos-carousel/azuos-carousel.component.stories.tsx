import { type Meta, type StoryObj } from '@storybook/react';
import { Tags } from 'lucide-react';

import { AzuosContentCard } from '../azuos-content-card/azuos-content-card.component';
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
    ui: { ariaLabel: 'Resumo por status' },
  },
  render: (args) => (
    <AzuosCarousel {...args}>
      {LABELS.map((label, index) => (
        <AzuosContentCard
          key={label}
          data={{ label: label, title: label, highlight: { value: index * 3 } }}
          ui={{ icon: Tags }}
        />
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
      <AzuosContentCard
        data={{ label: 'Total', title: 'Total', highlight: { value: 12 } }}
        ui={{ icon: Tags, iconTone: 'blue' }}
      />
      <AzuosContentCard
        data={{ label: 'Concluído', title: 'Concluído', highlight: { value: 4 } }}
        ui={{ icon: Tags, iconTone: 'green' }}
      />
    </AzuosCarousel>
  ),
};

/** Caso limite: faixa vazia — só as setas, desligadas. */
export const Empty: Story = {
  args: { ui: { ariaLabel: 'Sem indicadores' } },
};
