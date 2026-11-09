import { type Meta, type StoryObj } from '@storybook/react';
import { fn } from 'storybook/test';

import { AzuosArchivedList } from './azuos-archived-list.component';

const items = [
  {
    key: 'conversation:5',
    kind: 'Conversa',
    label: 'Protocolo entregue na prefeitura.',
    archivedAt: '2026-11-07T15:00:00.000Z',
    canRestore: true,
  },
  {
    key: 'attachment:9',
    kind: 'Anexo',
    label: 'alvara-bombeiro.pdf',
    archivedAt: '2026-11-06T10:30:00.000Z',
    canRestore: false,
  },
];

const meta = {
  title: 'Conteúdo e marcadores/AzuosArchivedList',
  component: AzuosArchivedList,
  args: {
    data: { title: 'Removidos deste alvará', items },
    ui: { className: 'w-96' },
    state: { isLoading: false, restoringKey: null, error: null },
    actions: { onOpenChange: fn(), onRestore: fn() },
  },
} satisfies Meta<typeof AzuosArchivedList>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Empty: Story = {
  args: { data: { title: 'Removidos deste alvará', items: [] } },
};

export const Loading: Story = {
  args: { state: { isLoading: true, restoringKey: null, error: null } },
};

export const Restoring: Story = {
  args: { state: { isLoading: false, restoringKey: 'conversation:5', error: null } },
};

export const Failed: Story = {
  args: {
    state: { isLoading: false, restoringKey: null, error: 'Não foi possível ler os removidos.' },
  },
};

/** Caso limite: nome de arquivo enorme, que tem de cortar sem empurrar o botão. */
export const LongLabel: Story = {
  args: {
    data: {
      title: 'Removidos deste alvará',
      items: [
        {
          ...items[0]!,
          label:
            'alvara-de-funcionamento-da-matriz-e-das-filiais-com-a-taxa-de-fiscalizacao-2026.pdf',
        },
      ],
    },
  },
};
