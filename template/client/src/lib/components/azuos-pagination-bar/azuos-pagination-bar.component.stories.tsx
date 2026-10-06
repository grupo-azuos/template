import { type Meta, type StoryObj } from '@storybook/react';
import { fn } from 'storybook/test';

import { AzuosPaginationBar } from './azuos-pagination-bar.component';

const meta = {
  title: 'Listas e tabelas/AzuosPaginationBar',
  component: AzuosPaginationBar,
  args: { actions: { onPageChange: fn() } },
} satisfies Meta<typeof AzuosPaginationBar>;

export default meta;

type Story = StoryObj<typeof meta>;

const NOUN: [string, string] = ['tarefa', 'tarefas'];

export const Default: Story = {
  args: { data: { page: 2, pageSize: 25, total: 312, noun: NOUN, gender: 'feminine' } },
};

/** Primeira página: "Anterior" fica desligada, não escondida — a barra não pula de lugar. */
export const FirstPage: Story = {
  args: { data: { page: 1, pageSize: 25, total: 312, noun: NOUN, gender: 'feminine' } },
};

export const LastPage: Story = {
  args: { data: { page: 13, pageSize: 25, total: 312, noun: NOUN, gender: 'feminine' } },
};

/** Uma página só: sem botões, e o total sozinho já responde tudo. */
export const SinglePage: Story = {
  args: { data: { page: 1, pageSize: 25, total: 7, noun: NOUN, gender: 'feminine' } },
};

export const Loading: Story = {
  args: {
    data: { page: 2, pageSize: 25, total: 312, noun: NOUN, gender: 'feminine' },
    state: { isLoading: true },
  },
};

/** Lista vazia: diz que não há nada, no singular. */
export const Empty: Story = {
  args: { data: { page: 1, pageSize: 25, total: 0, noun: NOUN, gender: 'feminine' } },
};

/** Caso limite: um item só — a frase vai para o singular. */
export const SingleItem: Story = {
  args: { data: { page: 1, pageSize: 25, total: 1, noun: NOUN, gender: 'feminine' } },
};
