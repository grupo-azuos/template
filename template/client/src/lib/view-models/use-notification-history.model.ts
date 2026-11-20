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
 * O HISTÓRICO DE NOTIFICAÇÕES do perfil — uma seção da ficha com as mais recentes (são muitas,
 * e o perfil não é a tela delas). "Ver todas" abre um DIÁLOGO com a lista inteira, paginada no
 * servidor e com os filtros: situação, nível, assunto, texto e período. Zero JSX.
 *
 * Duas perguntas separadas: o resumo é sempre o mesmo (as mais recentes, sem filtro) e fica
 * certo atrás do diálogo; a lista inteira só é pedida com o diálogo aberto.
 *
 * Mudar qualquer filtro volta à primeira página: ficar na página 7 de um recorte novo mostraria
 * uma lista vazia que não é verdade. Fechar o diálogo solta os filtros.
 */
export type NotificationFilters = Pick<
  NotificationQuery,
  'status' | 'severity' | 'topic' | 'search' | 'from' | 'to'
>;

export type NotificationHistoryModel = {
  data: {
    /** As mais recentes, para a seção do perfil. */
    recent: { items: Notification[]; total: number };
    /** A lista inteira do diálogo. */
    items: Notification[];
    filters: NotificationFilters;
    pagination: { page: number; pageSize: number; total: number };
  };
  state: {
    isRecentLoading: boolean;
    isLoading: boolean;
    isFetching: boolean;
    error: string | null;
    hasFilters: boolean;
    /** O diálogo com a lista inteira está aberto. */
    isExpanded: boolean;
  };
  actions: {
    onExpand: () => void;
    onCollapse: () => void;
    onFiltersChange: (patch: Partial<NotificationFilters>) => void;
    onClearFilters: () => void;
    onPageChange: (page: number) => void;
    onOpen: (notification: Notification) => void;
    onMarkAllRead: () => void;
  };
};

const PAGE_SIZE = 20;
/** Quantas a seção do perfil mostra: as mais recentes, sem filtro. */
export const PREVIEW_SIZE = 5;

const NO_FILTERS: NotificationFilters = {
  status: 'all',
  severity: undefined,
  topic: undefined,
  search: undefined,
  from: undefined,
  to: undefined,
};

const RECENT_QUERY = { ...NO_FILTERS, page: 1, pageSize: PREVIEW_SIZE };

/**
 * O diálogo aberto ou não. `startExpanded` é o pedido do sininho: o perfil nasce com ele
 * aberto, e pedir de novo com a tela já na frente (outro clique no sininho) abre também.
 */
function useExpanded(startExpanded: boolean): [boolean, (open: boolean) => void] {
  const [isExpanded, setIsExpanded] = useState(startExpanded);
  const [asked, setAsked] = useState(startExpanded);
  if (asked !== startExpanded) {
    setAsked(startExpanded);
    if (startExpanded) setIsExpanded(true);
  }

  return [isExpanded, setIsExpanded];
}

type NotificationPage = Awaited<ReturnType<typeof notificationsApi.page>>;

/** As notificações e o total de uma resposta — vazia enquanto ela não chegou. */
function pageOf(page: NotificationPage | undefined): { items: Notification[]; total: number } {
  if (!page) return { items: [], total: 0 };

  return { items: page.items, total: page.total };
}

/** O primeiro motivo de falha, na ordem de quem mais importa para a tela. */
function firstError(errors: unknown[]): string | null {
  for (const error of errors) {
    const message = readError(error);
    if (message) return message;
  }

  return null;
}

/**
 * `startExpanded`: o perfil foi aberto pelo "Ver o histórico" do sininho — o diálogo com a
 * lista inteira já abre.
 */
export function useNotificationHistoryModel(
  options: { startExpanded?: boolean } = {},
): NotificationHistoryModel {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [filters, setFilters] = useState<NotificationFilters>(NO_FILTERS);
  const [page, setPage] = useState(1);
  const [isExpanded, setIsExpanded] = useExpanded(options.startExpanded ?? false);
  const query = { ...filters, page, pageSize: PAGE_SIZE };

  const recent = useQuery({
    queryKey: ['notifications', 'history', RECENT_QUERY],
    queryFn: () => notificationsApi.page(RECENT_QUERY),
  });
  const history = useQuery({
    queryKey: ['notifications', 'history', query],
    queryFn: () => notificationsApi.page(query),
    placeholderData: keepPreviousData,
    enabled: isExpanded,
  });
  const refresh = () => void queryClient.invalidateQueries({ queryKey: ['notifications'] });
  const markRead = useMutation({ mutationFn: notificationsApi.markRead, onSettled: refresh });
  const markAllRead = useMutation({ mutationFn: notificationsApi.markAllRead, onSettled: refresh });
  const resetFilters = () => {
    setFilters(NO_FILTERS);
    setPage(1);
  };
  const full = pageOf(history.data);

  return {
    data: {
      recent: pageOf(recent.data),
      items: full.items,
      filters,
      pagination: { page, pageSize: PAGE_SIZE, total: full.total },
    },
    state: {
      isRecentLoading: recent.isLoading,
      isLoading: history.isLoading,
      isFetching: history.isFetching,
      error: firstError([history.error, recent.error, markAllRead.error]),
      hasFilters: JSON.stringify(filters) !== JSON.stringify(NO_FILTERS),
      isExpanded,
    },
    actions: {
      onExpand: () => setIsExpanded(true),
      onCollapse: () => {
        setIsExpanded(false);
        resetFilters();
      },
      onFiltersChange: (patch) => {
        setFilters((current) => ({ ...current, ...patch }));
        setPage(1);
      },
      onClearFilters: resetFilters,
      onPageChange: setPage,
      onOpen: (notification) => {
        if (!notification.readAt) markRead.mutate(notification.id);
        if (notification.action) void navigate({ to: notification.action.to });
      },
      onMarkAllRead: () => markAllRead.mutate(),
    },
  };
}
