import { type Meta, type StoryObj } from '@storybook/react';

import { AzuosBrandMark } from './azuos-brand-mark.component';

/**
 * A marca é BRANCA com o ponto amarelo, feita para fundo escuro — por isso as histórias a mostram
 * sobre o azul da marca, que é o único lugar onde ela aparece no sistema. Sobre branco ela some.
 */
const meta = {
  title: 'Navegação e estrutura/AzuosBrandMark',
  component: AzuosBrandMark,
  decorators: [
    (Story) => (
      <div className="bg-sidebar inline-flex items-center p-4">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof AzuosBrandMark>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const AllSizes: Story = {
  render: () => (
    <div className="flex flex-col items-start gap-4">
      <AzuosBrandMark ui={{ size: 'sm' }} />
      <AzuosBrandMark ui={{ size: 'md' }} />
      <AzuosBrandMark ui={{ size: 'lg' }} />
    </div>
  ),
};

/** No cabeçalho da barra lateral, que é onde ela mora de verdade. */
export const InTheSidebarHeader: Story = {
  render: () => (
    <div className="w-56">
      <AzuosBrandMark ui={{ size: 'sm' }} />
    </div>
  ),
};
