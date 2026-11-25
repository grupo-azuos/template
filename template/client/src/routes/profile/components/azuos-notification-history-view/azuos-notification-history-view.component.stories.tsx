import { type Meta, type StoryObj } from '@storybook/react';
import { type ComponentProps, useState } from 'react';
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

const STATE = {
  isRecentLoading: false,
  isLoading: false,
  isFetching: false,
  error: null,
  hasFilters: false,
  isExpanded: false,
};

const DATA = {
  recent: { items: ALL_SEVERITY_NOTIFICATIONS, total: 312 },
  items: ALL_SEVERITY_NOTIFICATIONS,
  filters: FILTERS,
  pagination: { page: 1, pageSize: 20, total: 312 },
};

type ViewProps = ComponentProps<typeof AzuosNotificationHistoryView>;

/**
 * Como no perfil: a seção mostra as recentes, e o diálogo com a lista inteira só abre quando a
 * pessoa clica em "Ver todas" — e fecha pelo X ou pelo Esc. As variações descrevem o que aparece
 * DENTRO do diálogo (várias páginas, filtro vazio, falha); abra para ver.
 */
function HistoryDemo(props: ViewProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <AzuosNotificationHistoryView
      {...props}
      state={{ ...props.state, isExpanded }}
      actions={{
        ...props.actions,
        onExpand: () => {
          setIsExpanded(true);
          props.actions.onExpand();
        },
        onCollapse: () => {
          setIsExpanded(false);
          props.actions.onCollapse();
        },
      }}
    />
  );
}

const meta = {
  title: 'Notificações/AzuosNotificationHistoryView',
  component: AzuosNotificationHistoryView,
  args: {
    data: DATA,
    state: STATE,
    actions: {
      onExpand: fn(),
      onCollapse: fn(),
      onFiltersChange: fn(),
      onClearFilters: fn(),
      onPageChange: fn(),
      onOpen: fn(),
      onMarkAllRead: fn(),
    },
  },
  render: (args) => <HistoryDemo {...args} />,
} satisfies Meta<typeof AzuosNotificationHistoryView>;

export default meta;

type Story = StoryObj<typeof meta>;

/* A seção do perfil: as mais recentes e o "Ver todas". */
export const Default: Story = {};

/* Clique em "Ver todas": o diálogo com a lista inteira, os filtros e as páginas. */
export const AllInDialog: Story = { args: { state: { ...STATE, isExpanded: true } } };

export const ManyPages: Story = {
  args: {
    data: { ...DATA, pagination: { page: 3, pageSize: 20, total: 312 } },
    state: { ...STATE, isExpanded: true },
  },
};

export const FilteredEmpty: Story = {
  args: {
    data: {
      ...DATA,
      items: [],
      filters: { ...FILTERS, severity: 'urgent' },
      pagination: { page: 1, pageSize: 20, total: 0 },
    },
    state: { ...STATE, isExpanded: true, hasFilters: true },
  },
};

export const Loading: Story = {
  args: { state: { ...STATE, isRecentLoading: true } },
};

/* Caso limite: nada recebido ainda — a seção diz isso, sem "Ver todas". */
export const Empty: Story = {
  args: { data: { ...DATA, recent: { items: [], total: 0 } } },
};

/* Clique em "Ver todas": a falha aparece no lugar da lista, sem barra de páginas. */
export const Failed: Story = {
  args: {
    state: {
      ...STATE,
      isExpanded: true,
      error: 'O servidor não respondeu a tempo. Tente de novo em instantes.',
    },
  },
};
