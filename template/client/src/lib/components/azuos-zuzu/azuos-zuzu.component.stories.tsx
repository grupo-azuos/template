import type { Meta, StoryObj } from '@storybook/react';

import { AzuosZuzu } from './azuos-zuzu.component';

/**
 * O mascote da casa. Ele não é enfeite: "nenhum resultado" com o Zuzu lendo é lido como "não há
 * nada aqui", enquanto a mesma tela em branco é lida como "quebrou".
 */
const meta = {
  title: 'Primitives/AzuosZuzu',
  component: AzuosZuzu,
  parameters: { layout: 'centered' },
} satisfies Meta<typeof AzuosZuzu>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/* As nove poses lado a lado: é assim que se escolhe a certa para uma tela, e é aqui que se vê
   se uma delas destoa das outras em tamanho ou enquadramento. */
export const Poses: Story = {
  render: () => (
    <div className="flex flex-wrap items-end gap-4">
      {(
        [
          'alert',
          'pointing',
          'leaning',
          'sleeping',
          'celebrating',
          'idea',
          'thumbsup',
          'magnifier',
          'clock',
        ] as const
      ).map((pose) => (
        <figure key={pose} className="flex flex-col items-center gap-1">
          <AzuosZuzu data={{ pose }} ui={{ size: 72 }} />
          <figcaption className="text-ink-500 text-xs">{pose}</figcaption>
        </figure>
      ))}
    </div>
  ),
};

export const Comemorando: Story = {
  args: { data: { pose: 'celebrating', anim: 'celebrate' }, ui: { size: 120 } },
};

export const Dormindo: Story = {
  args: { data: { pose: 'sleeping', anim: 'breathe' } },
};

/* Caso-limite de tamanho: ao lado de um texto curto ele precisa caber sem empurrar a linha. */
export const Pequeno: Story = {
  args: { data: { pose: 'magnifier' }, ui: { size: 40 } },
};
