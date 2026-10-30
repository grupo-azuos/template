import { type Meta, type StoryObj } from '@storybook/react';

import { AzuosErrorNotice } from './azuos-error-notice.component';

const meta = {
  title: 'Importados/AzuosErrorNotice',
  component: AzuosErrorNotice,
} satisfies Meta<typeof AzuosErrorNotice>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { data: { message: 'Esta ação é de Administrador.' } },
};

/** Caso limite: mensagem de duas linhas numa coluna estreita. */
export const TwoLinesInNarrowColumn: Story = {
  args: {
    data: {
      message:
        'Não consegui falar com o servidor (502). Tente de novo em instantes — se continuar, avise quem administra o acesso.',
    },
  },
  render: (args) => (
    <div className="border-ink-300 w-64 border border-dashed p-2">
      <AzuosErrorNotice {...args} />
    </div>
  ),
};
