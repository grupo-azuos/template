import { type Meta, type StoryObj } from '@storybook/react';

import { AzuosMiniStatCard } from './azuos-mini-stat-card.component';

const meta = {
  title: 'Cards/AzuosMiniStatCard',
  component: AzuosMiniStatCard,
  args: { data: { label: 'Em andamento', value: 12 }, ui: { tone: 'steel' } },
} satisfies Meta<typeof AzuosMiniStatCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Clickable: Story = {
  args: { actions: { onClick: () => {} } },
};

export const Selected: Story = {
  args: { state: { isSelected: true }, actions: { onClick: () => {} } },
};

/** Nome longo: corta com reticências, o nome inteiro fica no título. */
export const LongLabel: Story = {
  args: {
    data: { label: 'Serviço paralisado por falta de documento', value: 2 },
    ui: { tone: 'red' },
  },
};

/** Uma fileira com os oito sotaques. */
export const Row: Story = {
  render: () => (
    <div className="grid grid-cols-4 gap-2">
      {(['blue', 'red', 'amber', 'green', 'steel', 'plum', 'slate', 'copper'] as const).map(
        (tone, index) => (
          <AzuosMiniStatCard key={tone} data={{ label: tone, value: index + 1 }} ui={{ tone }} />
        ),
      )}
    </div>
  ),
};
