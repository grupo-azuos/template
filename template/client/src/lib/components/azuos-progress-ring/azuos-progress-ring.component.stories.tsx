import { type Meta, type StoryObj } from '@storybook/react';

import { AzuosProgressRing } from './azuos-progress-ring.component';

const meta = {
  title: 'Importados/AzuosProgressRing',
  component: AzuosProgressRing,
  args: { data: { done: 13, total: 28 } },
} satisfies Meta<typeof AzuosProgressRing>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const JustStarted: Story = { args: { data: { done: 2, total: 28 } } };

export const AlmostDone: Story = { args: { data: { done: 25, total: 28 } } };

export const Complete: Story = { args: { data: { done: 28, total: 28 } } };

export const Large: Story = { args: { data: { done: 13, total: 28 }, ui: { size: 'lg' } } };

/** Caso limite: nada a cumprir — cinza e "—", nunca 0% vermelho. */
export const NothingToDo: Story = { args: { data: { done: 0, total: 0 } } };
