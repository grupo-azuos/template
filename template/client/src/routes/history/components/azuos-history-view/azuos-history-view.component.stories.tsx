import type { Meta, StoryObj } from '@storybook/react';
import { fn } from 'storybook/test';

import { EMPTY_HISTORY_FILTER } from '../../../../lib/view-models/use-history.model';
import { AzuosHistoryView } from './azuos-history-view.component';

const meta = {
  title: 'Composers/AzuosHistoryView',
  component: AzuosHistoryView,
  args: {
    data: {
      entries: [
        {
          id: '9',
          kindLabel: 'Alterou a tarefa',
          tone: 'info',
          authorName: 'Ana Souza',
          createdAt: '2026-11-07T15:10:00.000Z',
          description: 'Tarefa: Revisar o contrato de exemplo\nStatus: todo → done',
        },
        {
          id: '8',
          kindLabel: 'Cadastrou a tarefa',
          tone: 'brand',
          authorName: 'Bia Lima',
          createdAt: '2026-11-07T13:02:00.000Z',
          description: 'Tarefa: Ligar para o cliente',
        },
        {
          id: '7',
          kindLabel: 'Excluiu a tarefa',
          tone: 'danger',
          authorName: 'Ana Souza',
          createdAt: '2026-11-06T18:40:00.000Z',
          description: 'Tarefa: Tarefa duplicada',
        },
      ],
      filter: EMPTY_HISTORY_FILTER,
      page: 1,
      pageSize: 50,
      total: 3,
    },
    state: { isLoading: false, isFetching: false, error: null },
    actions: { onFilterChange: fn(), onClearFilters: fn(), onPageChange: fn() },
  },
} satisfies Meta<typeof AzuosHistoryView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Filtered: Story = {
  args: {
    data: {
      ...meta.args.data,
      filter: { ...EMPTY_HISTORY_FILTER, who: 'mine', targetType: 'task' },
    },
  },
};

export const Empty: Story = { args: { data: { ...meta.args.data, entries: [], total: 0 } } };

export const Loading: Story = { args: { state: { ...meta.args.state, isLoading: true } } };

export const WithError: Story = {
  args: { state: { ...meta.args.state, error: 'Não foi possível carregar o histórico.' } },
};
