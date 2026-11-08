import { type Meta, type StoryObj } from '@storybook/react';
import { fn } from 'storybook/test';

import { ALL_SEVERITY_NOTIFICATIONS } from '../../../../lib/utils/notification-fixture.util';
import { AzuosNotificationHistoryView } from './azuos-notification-history-view.component';

const FILTERS = {
  status: 'all' as const,
  severity: undefined,
  topic: undefined,
  search: undefined,
  from: undefined,
  to: undefined,
};

const meta = {
  title: 'Notificações/AzuosNotificationHistoryView',
  component: AzuosNotificationHistoryView,
  args: {
    data: {
      items: ALL_SEVERITY_NOTIFICATIONS,
      filters: FILTERS,
      pagination: { page: 1, pageSize: 20, total: 4 },
    },
    state: { isLoading: false, isFetching: false, error: null, hasFilters: false },
    actions: {
      onFiltersChange: fn(),
      onClearFilters: fn(),
      onPageChange: fn(),
      onOpen: fn(),
      onMarkAllRead: fn(),
    },
  },
} satisfies Meta<typeof AzuosNotificationHistoryView>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const ManyPages: Story = {
  args: {
    data: {
      items: ALL_SEVERITY_NOTIFICATIONS,
      filters: FILTERS,
      pagination: { page: 3, pageSize: 20, total: 312 },
    },
  },
};

export const FilteredEmpty: Story = {
  args: {
    data: {
      items: [],
      filters: { ...FILTERS, severity: 'urgent' },
      pagination: { page: 1, pageSize: 20, total: 0 },
    },
    state: { isLoading: false, isFetching: false, error: null, hasFilters: true },
  },
};

export const Loading: Story = {
  args: { state: { isLoading: true, isFetching: true, error: null, hasFilters: false } },
};

export const Failed: Story = {
  args: {
    state: {
      isLoading: false,
      isFetching: false,
      error: 'Não consegui ler o histórico.',
      hasFilters: false,
    },
  },
};
