import { type Meta, type StoryObj } from '@storybook/react';
import { fn } from 'storybook/test';

import { AzuosToneCard, type AzuosToneCardTone } from './azuos-tone-card.component';

const TONES: AzuosToneCardTone[] = ['brand', 'neutral', 'success', 'warning', 'danger', 'info'];

const meta = {
  title: 'Superfícies/AzuosToneCard',
  component: AzuosToneCard,
  args: { data: { label: 'Vencidos' }, ui: { tone: 'danger' }, children: 'Conteúdo do card' },
} satisfies Meta<typeof AzuosToneCard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Static: Story = {};

export const Interactive: Story = { args: { ui: { tone: 'success', mode: 'interactive' } } };

export const Clickable: Story = {
  args: { ui: { tone: 'warning', mode: 'interactive' }, actions: { onClick: fn() } },
};

export const Selected: Story = {
  args: { ui: { tone: 'brand', mode: 'interactive' }, state: { isSelected: true } },
};

export const AllTonesStatic: Story = {
  render: () => (
    <div className="grid gap-3 sm:grid-cols-3">
      {TONES.map((tone) => (
        <AzuosToneCard key={tone} data={{ label: tone }} ui={{ tone }}>
          {tone}
        </AzuosToneCard>
      ))}
    </div>
  ),
};

export const AllTonesInteractive: Story = {
  render: () => (
    <div className="grid gap-3 sm:grid-cols-3">
      {TONES.map((tone) => (
        <AzuosToneCard key={tone} data={{ label: tone }} ui={{ tone, mode: 'interactive' }}>
          {tone}
        </AzuosToneCard>
      ))}
    </div>
  ),
};
