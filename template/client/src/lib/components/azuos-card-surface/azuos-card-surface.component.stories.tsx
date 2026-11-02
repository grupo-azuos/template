import { type Meta, type StoryObj } from '@storybook/react';
import { Hourglass } from 'lucide-react';

import { AzuosCardSurface } from './azuos-card-surface.component';

const meta = {
  title: 'Cards/AzuosCardSurface',
  component: AzuosCardSurface,
  args: { data: { label: 'Card' }, children: <p className="p-5 text-sm">Conteúdo do card</p> },
} satisfies Meta<typeof AzuosCardSurface>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A superfície da marca, com o hover neutro do GSAP. */
export const Default: Story = {};

/** O hover entra na cor do sotaque: precisa da flag e do tom. */
export const HoverColored: Story = {
  args: { ui: { isHoverColored: true, hoverTone: 'copper' } },
};

/** O ícone grande no canto, no sotaque, atrás do texto. */
export const WithMark: Story = {
  args: { ui: { mark: Hourglass, markTone: 'copper', className: 'min-h-40' } },
};

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
