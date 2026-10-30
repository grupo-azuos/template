import { type Meta, type StoryObj } from '@storybook/react';

import { AzuosInfiniteScrollFooter } from './azuos-infinite-scroll-footer.component';

const meta = {
  title: 'Importados/AzuosInfiniteScrollFooter',
  component: AzuosInfiniteScrollFooter,
  args: {
    ui: { itemNoun: { singular: 'empresa', plural: 'empresas' } },
    actions: { onLoadMore: () => {} },
  },
} satisfies Meta<typeof AzuosInfiniteScrollFooter>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { data: { loaded: 50, totalItems: 566 }, state: { isLoading: false, hasMore: true } },
};

export const Loading: Story = {
  args: { data: { loaded: 50, totalItems: 566 }, state: { isLoading: true, hasMore: true } },
};

/** Fim da lista: não há botão, porque não há para onde ir. */
export const Complete: Story = {
  args: { data: { loaded: 566, totalItems: 566 }, state: { isLoading: false, hasMore: false } },
};

/** Caso limite: um item só, no singular. */
export const SingleItem: Story = {
  args: { data: { loaded: 1, totalItems: 1 }, state: { isLoading: false, hasMore: false } },
};

/** Caso limite: número grande, para a linha não quebrar. */
export const ManyItems: Story = {
  args: { data: { loaded: 1_250, totalItems: 48_310 }, state: { isLoading: false, hasMore: true } },
};
