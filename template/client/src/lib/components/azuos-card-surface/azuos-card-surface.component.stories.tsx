import { type Meta, type StoryObj } from '@storybook/react';

import { AzuosCardSurface } from './azuos-card-surface.component';

const meta = {
  title: 'Cards/AzuosCardSurface (base do card de conteúdo)',
  component: AzuosCardSurface,
  args: { data: { label: 'Card' }, children: <p className="p-5 text-sm">Conteúdo do card</p> },
} satisfies Meta<typeof AzuosCardSurface>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A superfície do card de conteúdo: parada, sem borda, com o fio e a sombra difusa. */
export const Default: Story = {};

export const Clickable: Story = {
  args: { actions: { onClick: () => {} } },
};

/** Escolhido: o azul claro da marca, com texto branco. */
export const Selected: Story = {
  args: { state: { isSelected: true }, actions: { onClick: () => {} } },
};

/** Desligado enquanto carrega: o clique não responde. */
export const Disabled: Story = {
  args: { state: { isDisabled: true }, actions: { onClick: () => {} } },
};
