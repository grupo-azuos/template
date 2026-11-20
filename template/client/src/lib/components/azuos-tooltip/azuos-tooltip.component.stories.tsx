import { type Meta, type StoryObj } from '@storybook/react';

import { Button } from '../azuos-button/azuos-button';
import { AzuosTooltip } from './azuos-tooltip.component';

const meta = {
  title: 'Conteúdo e marcadores/AzuosTooltip',
  component: AzuosTooltip,
  decorators: [
    (Story) => (
      <div className="flex min-h-40 items-center justify-center">
        <Story />
      </div>
    ),
  ],
  args: {
    data: { content: 'O texto inteiro, que a tela cortou.' },
    /* O gatilho é o `Button` de `azuos-button`, que repassa os eventos do Radix (a regra da casa
       para gatilho de dica, menu ou popover). O `AzuosActionButton` não repassa: a dica não abria
       e só aparecia a dica nativa do navegador. */
    children: <Button variant="secondary">Passe o mouse</Button>,
  },
} satisfies Meta<typeof AzuosTooltip>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Bottom: Story = { args: { ui: { side: 'bottom' } } };

export const LongText: Story = {
  args: {
    data: {
      content:
        'Inconsistência entre o livro de apuração e a escrituração fiscal digital com um texto bem comprido para ver a dica quebrando a linha sem sair da tela.',
    },
  },
};

/** Aberta por comando, sem o mouse: a tela aponta para o elemento. */
export const OpenOnCommand: Story = { args: { state: { isOpen: true } } };

export const Disabled: Story = { args: { state: { isDisabled: true } } };

export const WithoutContent: Story = { args: { data: { content: '' } } };
