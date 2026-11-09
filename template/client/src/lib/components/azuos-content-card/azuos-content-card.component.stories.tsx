import { type Meta, type StoryObj } from '@storybook/react';
import { CheckCircle2, Hourglass } from 'lucide-react';

import { AzuosContentCard } from './azuos-content-card.component';

const meta = {
  title: 'Cards/AzuosContentCard',
  component: AzuosContentCard,
  args: {
    data: { label: 'Clínica Sorriso' },
    ui: { tone: 'copper', icon: Hourglass, className: 'w-64 min-h-44' },
    children: (
      <>
        <h3 className="text-sm font-bold">CLÍNICA ODONTO SORRISO PLENO LTDA</h3>
        <p className="font-mono text-xs text-muted-foreground">39.099.603/0001-28</p>
        <p className="text-xs text-muted-foreground">Fortaleza · Marina Prado</p>
      </>
    ),
  },
} satisfies Meta<typeof AzuosContentCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** Hover na cor do sotaque. */
export const HoverColored: Story = {
  args: {
    ui: { tone: 'green', icon: CheckCircle2, isHoverColored: true, className: 'w-64 min-h-44' },
  },
};

export const Clickable: Story = {
  args: { actions: { onClick: () => {} } },
};

/** Sem ícone: só a superfície. */
export const WithoutIcon: Story = {
  args: { ui: { className: 'w-64' } },
};
