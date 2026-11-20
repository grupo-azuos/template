import { type Meta, type StoryObj } from '@storybook/react';

import { AzuosThemeToggle } from '../azuos-theme-toggle/azuos-theme-toggle.component';
import { AzuosEffectsToggle } from './azuos-effects-toggle.component';

const meta = {
  title: 'Preferências/AzuosEffectsToggle',
  component: AzuosEffectsToggle,
} satisfies Meta<typeof AzuosEffectsToggle>;

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * O sistema escolhe sozinho pelo que a máquina aguenta; este botão é para quem quer mandar. O ícone
 * mostra o modo de AGORA — faíscas no completo, medidor no leve.
 */
export const Default: Story = {};

/** No canto do menu, ao lado do botão de tema. */
export const NextToTheThemeToggle: Story = {
  render: () => (
    /* O par do canto do menu, num trilho do tamanho dos dois botões. */
    <div className="bg-muted inline-flex w-fit items-center gap-1 rounded-full p-1">
      <AzuosThemeToggle />
      <AzuosEffectsToggle />
    </div>
  ),
};
