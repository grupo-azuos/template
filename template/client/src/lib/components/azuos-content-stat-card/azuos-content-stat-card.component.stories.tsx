import { type Meta, type StoryObj } from '@storybook/react';
import { BellOff, Building2, HeartPulse, Stamp } from 'lucide-react';

import { AzuosContentStatCard } from './azuos-content-stat-card.component';

const meta = {
  title: 'Gráficos e números/AzuosContentStatCard',
  component: AzuosContentStatCard,
  decorators: [
    (Story) => (
      <div className="max-w-sm">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof AzuosContentStatCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    data: { label: 'Alvarás', value: '6.805', hint: 'no recorte' },
    ui: { icon: Stamp, tone: 'brand' },
  },
};

/** O amarelo: o número no amarelo do grupo, puro. */
export const Yellow: Story = {
  args: {
    data: { label: 'Empresas afetadas', value: 552, hint: 'com ocorrência' },
    ui: { icon: Building2, tone: 'warning' },
  },
};

export const Danger: Story = {
  args: {
    data: { label: 'Pendências na carteira', value: 81, hint: 'em 7 responsáveis' },
    ui: { icon: BellOff, tone: 'danger' },
  },
};

/** Caso limite: rótulo comprido e sem a linha de baixo. */
export const LongLabelNoHint: Story = {
  args: {
    data: { label: 'Saúde da equipe inteira em todas as carteiras ativas', value: '95%' },
    ui: { icon: HeartPulse, tone: 'success' },
  },
};
