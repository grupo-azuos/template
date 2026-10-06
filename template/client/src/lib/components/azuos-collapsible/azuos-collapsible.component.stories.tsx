import { type Meta, type StoryObj } from '@storybook/react';
import { fn } from 'storybook/test';

import { AzuosCollapsible } from './azuos-collapsible.component';

const meta = {
  title: 'Conteúdo e marcadores/AzuosCollapsible',
  component: AzuosCollapsible,
  args: { actions: { onOpenChange: fn() } },
} satisfies Meta<typeof AzuosCollapsible>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    data: { title: 'Filtros avançados' },
    ui: { className: 'w-96' },
    children: <p>Prazo, responsável e etiquetas entram aqui.</p>,
  },
};

/** Nasce aberto: para o bloco que quase sempre é consultado. */
export const StartsOpen: Story = {
  args: {
    data: { title: 'Filtros avançados' },
    ui: { className: 'w-96' },
    state: { isOpen: true },
    children: <p>Prazo, responsável e etiquetas entram aqui.</p>,
  },
};

export const Disabled: Story = {
  args: {
    data: { title: 'Filtros avançados (carregando…)' },
    ui: { className: 'w-96' },
    state: { isDisabled: true },
    children: <p>Prazo, responsável e etiquetas entram aqui.</p>,
  },
};

/** Caso limite: título longo num bloco estreito — quebra, e a seta não sai de lugar. */
export const LongTitleInNarrowBlock: Story = {
  args: {
    data: { title: 'Filtros avançados por responsável, prazo e etiqueta da tarefa' },
    ui: { className: 'w-56' },
    children: <p>Conteúdo do bloco.</p>,
  },
};
