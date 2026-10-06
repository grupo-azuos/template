import { type Meta, type StoryObj } from '@storybook/react';

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
    <div className="border-border bg-card flex w-40 items-center justify-end gap-1 rounded-lg border p-2">
      <AzuosEffectsToggle />
    </div>
  ),
};
