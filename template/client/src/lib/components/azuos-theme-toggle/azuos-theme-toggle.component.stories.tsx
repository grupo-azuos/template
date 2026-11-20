import { type Meta, type StoryObj } from '@storybook/react';

import { AzuosEffectsToggle } from '../azuos-effects-toggle/azuos-effects-toggle.component';
import { AzuosThemeToggle } from './azuos-theme-toggle.component';

const meta = {
  title: 'Preferências/AzuosThemeToggle',
  component: AzuosThemeToggle,
} satisfies Meta<typeof AzuosThemeToggle>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Clique para trocar: o ícone mostra o tema de AGORA, não para onde o clique leva. */
export const Default: Story = {};

/** Como ele aparece no canto do menu, ao lado de outro controle discreto. */
export const InAToolbar: Story = {
  render: () => (
    /* O par do canto do menu, num trilho do tamanho dos dois botões. */
    <div className="bg-muted inline-flex w-fit items-center gap-1 rounded-full p-1">
      <AzuosThemeToggle />
      <AzuosEffectsToggle />
    </div>
  ),
};
