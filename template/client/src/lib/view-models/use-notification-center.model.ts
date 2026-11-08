import { type QueryClient, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { type Notification } from '@template/shared/schemas/notification.schema';
import { canManageNotifications } from '@template/shared/schemas/user.schema';

import { readError } from '../api/http-client';
import { notificationsApi } from '../api/notifications.api';
import { mockAuth } from '../auth/mock-user';
import { byAttention, notificationLook } from '../utils/notification-style.util';

/**
 * A CENTRAL DE NOTIFICAÇÕES de quem está logado — o sininho, o diálogo de entrada, o toast em
 * tempo real. Zero JSX.
 *
 * - AO ENTRAR: se há não lidas, o diálogo abre com elas, a urgente primeiro. O conjunto é
 *   CONGELADO na abertura: marcar uma como lida não a tira da frente de quem está lendo.
 * - COM O SISTEMA ABERTO: o servidor avisa (SSE) e a caixa é relida. A urgente nova abre o
 *   diálogo; as outras chegam como toast. Sem SSE (queda), a caixa é relida a cada 5 min.
 * - Abrir uma notificação marca como lida e leva à tela do assunto.
 */
export type NotificationCenterModel = {
  data: {
    /** As não lidas mais recentes — o sininho. */
    items: Notification[];
    unread: number;
    /** O que o diálogo mostra, na ordem de atenção. */
    dialogItems: Notification[];
  };
  state: {
    isLoading: boolean;
    error: string | null;
    isDialogOpen: boolean;
    canManage: boolean;
  };
  actions: {
    onOpen: (notification: Notification) => void;
    /** Grava como lidas, numa chamada só — o diálogo manda a cada passo. */
    onMarkRead: (ids: string[]) => void;
    onMarkAllRead: () => void;
    onCloseDialog: () => void;
    onOpenHistory: () => void;
  };
};

const INBOX_KEY = ['notifications', 'inbox'] as const;

/** A rede de segurança do tempo real: sem SSE, a caixa ainda é relida de 5 em 5 minutos. */
const FALLBACK_REFRESH_MS = 5 * 60 * 1000;

export function useNotificationCenterModel(): NotificationCenterModel {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const user = mockAuth.getUser();

  const inbox = useQuery({
    queryKey: INBOX_KEY,
    queryFn: notificationsApi.inbox,
    refetchInterval: FALLBACK_REFRESH_MS,
  });
  const items = inbox.data?.items ?? [];
  const queue = useDialogQueue(inbox.data);

  const refresh = () => void queryClient.invalidateQueries({ queryKey: ['notifications'] });
  const markRead = useMutation({ mutationFn: notificationsApi.markRead, onSettled: refresh });
  const markAllRead = useMutation({ mutationFn: notificationsApi.markAllRead, onSettled: refresh });
  const markManyRead = useMutation({
    mutationFn: notificationsApi.markManyRead,
    onSettled: refresh,
  });

  const openNotification = (notification: Notification) => {
    if (!notification.readAt) markRead.mutate(notification.id);
    queue.close();
    if (notification.action) void navigate({ to: notification.action.to });
  };

  useNotificationStream(queryClient);
  useEffect(() => {
    for (const item of queue.arrived) {
      if (item.severity !== 'urgent') announce(item, () => openNotification(item));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- anuncia uma vez por chegada
  }, [queue.arrived]);

  return {
    data: { items, unread: inbox.data?.unread ?? 0, dialogItems: queue.items },
    state: {
      isLoading: inbox.isLoading,
      error: readError(inbox.error) ?? readError(markRead.error) ?? readError(markAllRead.error),
      isDialogOpen: queue.items.length > 0,
      canManage: canManageNotifications(user.role),
    },
    actions: {
      onOpen: openNotification,
      onMarkRead: (ids) => {
        if (ids.length > 0) markManyRead.mutate(ids);
      },
      onMarkAllRead: () => markAllRead.mutate(),
      onCloseDialog: queue.close,
      /* A seção de notificações do perfil, já aberta na lista inteira, e a página rolada até ela. */
      onOpenHistory: () =>
        void navigate({
          to: '/profile',
          search: { tab: 'notifications' },
          hash: 'profile-notifications',
        }),
    },
  };
}

/**
 * A FILA DO DIÁLOGO. Cada caixa relida é comparada com a anterior AQUI, no render (e não num
 * efeito): a primeira abre o diálogo com as não lidas; as seguintes separam o que é novo de
 * verdade, e só a urgente nova entra na fila. O resto vira toast, fora daqui.
 */
function useDialogQueue(data: { items: Notification[] } | undefined) {
  const [items, setItems] = useState<Notification[]>([]);
  const [snapshot, setSnapshot] = useState<Snapshot>(EMPTY_SNAPSHOT);

  if (data && data !== snapshot.data) {
    const notifications = data.items;
    const next = nextSnapshot(snapshot, notifications, data);
    setSnapshot(next);
    const opening = next.isFirst
      ? notifications
      : next.arrived.filter((item) => item.severity === 'urgent');
    if (opening.length > 0) setItems((current) => byAttention([...current, ...opening]));
  }

  return { items, arrived: snapshot.arrived, close: () => setItems([]) };
}

/** O que já se viu da caixa, e o que chegou de novo na última releitura. */
type Snapshot = {
  data: unknown;
  known: ReadonlySet<string> | null;
  arrived: Notification[];
  isFirst: boolean;
};

const EMPTY_SNAPSHOT: Snapshot = { data: undefined, known: null, arrived: [], isFirst: false };

export function nextSnapshot(
  previous: Snapshot,
  items: readonly Notification[],
  data: unknown,
): Snapshot {
  const ids = items.map((item) => item.id);
  if (previous.known === null) return { data, known: new Set(ids), arrived: [], isFirst: true };

  const known = previous.known;

  return {
    data,
    known: new Set([...known, ...ids]),
    arrived: items.filter((item) => !known.has(item.id)),
    isFirst: false,
  };
}

/**
 * O fluxo em tempo real: cada sinal do servidor relê a caixa. O `EventSource` reconecta sozinho
 * quando a conexão cai; onde ele não existe (teste), a caixa ainda é relida de 5 em 5 minutos.
 */
function useNotificationStream(queryClient: QueryClient): void {
  useEffect(() => {
    if (typeof EventSource === 'undefined') return;
    const source = new EventSource(notificationsApi.streamUrl(), { withCredentials: true });
    source.addEventListener('notification', () => {
      void queryClient.invalidateQueries({ queryKey: ['notifications'] });
    });

    return () => source.close();
  }, [queryClient]);
}

/** O toast da notificação nova: o nível no título, o texto embaixo, e a ação de abrir. */
function announce(notification: Notification, onOpen: () => void): void {
  if (notification.severity === 'info') return;
  const look = notificationLook(notification.severity);

  toast(`${look.label} · ${notification.title}`, {
    id: notification.id,
    description: notification.body,
    action: notification.action ? { label: notification.action.label, onClick: onOpen } : undefined,
  });
}
