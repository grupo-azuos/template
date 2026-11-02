import { type Meta, type StoryObj } from '@storybook/react';

import { AzuosLoadingState } from './azuos-loading-state.component';

const meta = {
  title: 'Conteúdo e marcadores/AzuosLoadingState',
  component: AzuosLoadingState,
} satisfies Meta<typeof AzuosLoadingState>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { data: { label: 'Carregando usuários…' } },
};

/** Caso limite: legenda longa numa coluna estreita. */
export const LongLabelInNarrowColumn: Story = {
  args: { data: { label: 'Conferindo a sua sessão antes de abrir a administração…' } },
  render: (args) => (
    <div className="border-ink-300 w-56 border border-dashed p-2">
      <AzuosLoadingState {...args} />
    </div>
  ),
};
