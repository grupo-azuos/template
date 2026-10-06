import { type Meta, type StoryObj } from '@storybook/react';

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
    <div className="border-border bg-card flex w-40 items-center justify-end gap-1 rounded-lg border p-2">
      <AzuosThemeToggle />
    </div>
  ),
};
