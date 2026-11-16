import { type QueryClient, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { type Notification } from '@template/shared/schemas/notification.schema';
import { canManageNotifications } from '@template/shared/schemas/user.schema';

import { readError } from '../api/http-client';
import { notificationsApi } from '../api/notifications.api';
import { mockAuth } from '../auth/mock-user';
import { isEntryDue, markEntrySeen, todayInBrasilia } from '../utils/notification-entry.util';
import { byAttention, notificationLook } from '../utils/notification-style.util';

/**
 * A CENTRAL DE NOTIFICAÇÕES de quem está logado — o sininho, o diálogo de entrada, o toast em
 * tempo real. Zero JSX.
 *
 * - AO ENTRAR (sessão nova do navegador ou primeiro acesso do dia, `notification-entry.util`): se
 *   há não lidas, o diálogo abre com elas, a urgente primeiro. O conjunto é CONGELADO na
 *   abertura: marcar uma como lida não a tira da frente de quem está lendo. F5 e aba nova no
 *   mesmo dia não abrem de novo — as não lidas seguem no sininho.
 * - COM O SISTEMA ABERTO: o servidor avisa (SSE) e a caixa é relida. Toda notificação nova, de
 *   qualquer nível, chega como TOAST no canto da tela — nunca abre o diálogo por cima do
 *   trabalho. A urgente fica mais tempo na tela. Sem SSE (queda), a caixa é relida a cada 5 min.
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
    /** Grava como lidas, numa chamada só — o diálogo manda todas que mostrou. */
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
  const queue = useDialogQueue(inbox.data, user.id);

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
    for (const item of queue.arrived) announce(item, () => openNotification(item));
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
 * efeito): a primeira abre o diálogo com as não lidas, se a entrada está devida; as seguintes só
 * separam o que é novo de verdade, para o toast (que sai fora daqui).
 */
function useDialogQueue(data: { items: Notification[] } | undefined, userId: string) {
  const [items, setItems] = useState<Notification[]>([]);
  const [snapshot, setSnapshot] = useState<Snapshot>(EMPTY_SNAPSHOT);

  if (data && data !== snapshot.data) {
    const notifications = data.items;
    const next = nextSnapshot(snapshot, notifications, data);
    setSnapshot(next);
    if (next.isFirst && notifications.length > 0 && isEntryDue(userId, todayInBrasilia())) {
      setItems(byAttention(notifications));
    }
  }

  /* A marca da entrada é gravada DEPOIS de desenhar, e não no render: o render pode rodar duas
     vezes, e a segunda leria a marca da primeira e não abriria o hero. Conta como entrada vista
     mesmo sem não lidas — o primeiro acesso do dia já passou. */
  useEffect(() => {
    if (snapshot.isFirst) markEntrySeen(userId, todayInBrasilia());
  }, [snapshot.isFirst, userId]);

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

/**
 * A cara do toast de notificação: o azul escuro da marca, igual ao hero, com o texto claro e a
 * ação no amarelo de destaque. Só este toast é azul — os avisos de "salvo" seguem os do tema.
 * O `!` vence as cores que o Sonner põe por conta própria.
 */
export const NOTIFICATION_TOAST_CLASSES = {
  toast: '!border-0 !bg-brand-blue-900 !text-on-dark !shadow-card',
  title: '!font-semibold !text-on-dark',
  description: '!text-on-dark/80',
  actionButton: '!bg-accent-hero !font-semibold !text-accent-hero-foreground',
  closeButton: '!border-0 !bg-brand-blue-800 !text-on-dark',
};

/** Quanto a urgente fica na tela — o triplo do aviso comum, para não passar despercebida. */
export const URGENT_TOAST_DURATION_MS = 15_000;

/**
 * O toast da notificação nova, de qualquer nível: o nível no título, o texto embaixo, e a ação de
 * abrir. A urgente fica mais tempo; as outras, o tempo padrão do `AzuosToaster`.
 */
function announce(notification: Notification, onOpen: () => void): void {
  const look = notificationLook(notification.severity);

  toast(`${look.label} · ${notification.title}`, {
    id: notification.id,
    description: notification.body,
    classNames: NOTIFICATION_TOAST_CLASSES,
    ...(notification.severity === 'urgent' ? { duration: URGENT_TOAST_DURATION_MS } : {}),
    action: notification.action ? { label: notification.action.label, onClick: onOpen } : undefined,
  });
}
