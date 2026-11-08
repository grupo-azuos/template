import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { useState } from 'react';

import {
  type Notification,
  type NotificationQuery,
} from '@template/shared/schemas/notification.schema';

import { readError } from '../api/http-client';
import { notificationsApi } from '../api/notifications.api';

/**
 * O HISTÓRICO DE NOTIFICAÇÕES do perfil — tudo o que a pessoa recebeu, paginado no servidor
 * (são muitas) e com os filtros: situação, nível, assunto, texto e período. Zero JSX.
 *
 * Mudar qualquer filtro volta à primeira página: ficar na página 7 de um recorte novo mostraria
 * uma lista vazia que não é verdade.
 */
export type NotificationFilters = Pick<
  NotificationQuery,
  'status' | 'severity' | 'topic' | 'search' | 'from' | 'to'
>;

export type NotificationHistoryModel = {
  data: {
    items: Notification[];
    filters: NotificationFilters;
    pagination: { page: number; pageSize: number; total: number };
  };
  state: { isLoading: boolean; isFetching: boolean; error: string | null; hasFilters: boolean };
  actions: {
    onFiltersChange: (patch: Partial<NotificationFilters>) => void;
    onClearFilters: () => void;
    onPageChange: (page: number) => void;
    onOpen: (notification: Notification) => void;
    onMarkAllRead: () => void;
  };
};

const PAGE_SIZE = 20;

const NO_FILTERS: NotificationFilters = {
  status: 'all',
  severity: undefined,
  topic: undefined,
  search: undefined,
  from: undefined,
  to: undefined,
};

export function useNotificationHistoryModel(): NotificationHistoryModel {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [filters, setFilters] = useState<NotificationFilters>(NO_FILTERS);
  const [page, setPage] = useState(1);

  const history = useQuery({
    queryKey: ['notifications', 'history', filters, page],
    queryFn: () => notificationsApi.page({ ...filters, page, pageSize: PAGE_SIZE }),
    placeholderData: keepPreviousData,
  });
  const refresh = () => void queryClient.invalidateQueries({ queryKey: ['notifications'] });
  const markRead = useMutation({ mutationFn: notificationsApi.markRead, onSettled: refresh });
  const markAllRead = useMutation({ mutationFn: notificationsApi.markAllRead, onSettled: refresh });

  return {
    data: {
      items: history.data?.items ?? [],
      filters,
      pagination: { page, pageSize: PAGE_SIZE, total: history.data?.total ?? 0 },
    },
    state: {
      isLoading: history.isLoading,
      isFetching: history.isFetching,
      error: readError(history.error) ?? readError(markAllRead.error),
      hasFilters: JSON.stringify(filters) !== JSON.stringify(NO_FILTERS),
    },
    actions: {
      onFiltersChange: (patch) => {
        setFilters((current) => ({ ...current, ...patch }));
        setPage(1);
      },
      onClearFilters: () => {
        setFilters(NO_FILTERS);
        setPage(1);
      },
      onPageChange: setPage,
      onOpen: (notification) => {
        if (!notification.readAt) markRead.mutate(notification.id);
        if (notification.action) void navigate({ to: notification.action.to });
      },
      onMarkAllRead: () => markAllRead.mutate(),
    },
  };
}
