import { type Meta, type StoryObj } from '@storybook/react';

import { AzuosTableViewToggle } from './azuos-table-view-toggle.component';

const meta = {
  title: 'Listas e tabelas/AzuosTableViewToggle',
  component: AzuosTableViewToggle,
} satisfies Meta<typeof AzuosTableViewToggle>;

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * Os dois formatos aparecem sempre, e o que está valendo fica preenchido. Clique para trocar — a
 * preferência é do sistema inteiro, então ela sobrevive à recarga da página.
 */
export const Default: Story = {};

/**
 * Abaixo de `xl` o controle some: no celular e no tablet a lista é sempre em cartões, e um "Tabela"
 * marcado ali seria mentira. Diminua a janela da pré-visualização para ver.
 */
export const HiddenOnNarrowScreens: Story = {
  render: () => (
    <div className="border-ink-300 flex flex-col gap-2 border border-dashed p-3">
      <p className="text-ink-500 text-xs">
        Acima de 1280px o controle aparece; abaixo, não há o que escolher.
      </p>
      <AzuosTableViewToggle />
    </div>
  ),
};
