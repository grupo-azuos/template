import { z } from 'zod';

import { paginatedSchema, paginationQuerySchema } from './pagination.schema';

/**
 * AS NOTIFICAÇÕES DE QUEM USA O SISTEMA — o sininho do app-shell, o diálogo ao entrar, o toast
 * em tempo real e o histórico no perfil. É o padrão dos sistemas do Grupo Azuos.
 *
 * Cada notificação nasce de um ASSUNTO (`topic`) com um NÍVEL (`severity`). O nível decide o
 * desenho e as regras de leitura:
 *
 * - `urgent` — abre sozinha no meio da tela e só fecha depois de lida: o botão "Li e entendi"
 *   espera `URGENT_READ_SECONDS`, e Esc não fecha.
 * - `important` — abre sozinha ao entrar no sistema; Esc e X fecham.
 * - `normal` — fica no sininho e chega como toast; não interrompe ninguém.
 * - `info` — novidade (versão nova, dica): sininho e histórico, sem toast.
 *
 * Nada se apaga: lida, a notificação sai do destaque e continua no histórico.
 */
export const NOTIFICATION_SEVERITIES = ['urgent', 'important', 'normal', 'info'] as const;

export const notificationSeveritySchema = z.enum(NOTIFICATION_SEVERITIES);

export type NotificationSeverity = z.infer<typeof notificationSeveritySchema>;

/** Quanto tempo a urgente fica na frente da pessoa antes de liberar o "Li e entendi". */
export const URGENT_READ_SECONDS = 10;

/**
 * OS ASSUNTOS, com o nível padrão. O administrador decide, no perfil, quais o sistema notifica
 * e com que nível — o padrão é o que vale enquanto ninguém mexeu.
 *
 * Feature nova que avisa alguém ganha o assunto dela AQUI, e chama `NotificationsService.notify`
 * no service, com os ids de quem recebe.
 */
export const NOTIFICATION_TOPICS = {
  'system.release': {
    label: 'Versão nova do sistema',
    description: 'O sistema foi atualizado — o que mudou.',
    severity: 'info',
  },
} as const satisfies Record<
  string,
  { label: string; description: string; severity: NotificationSeverity }
>;

export type NotificationTopic = keyof typeof NOTIFICATION_TOPICS;

export const NOTIFICATION_TOPIC_KEYS = Object.keys(NOTIFICATION_TOPICS) as NotificationTopic[];

export const notificationTopicSchema = z.enum(
  NOTIFICATION_TOPIC_KEYS as [NotificationTopic, ...NotificationTopic[]],
);

export const notificationSchema = z.object({
  id: z.uuid(),
  topic: notificationTopicSchema,
  severity: notificationSeveritySchema,
  title: z.string(),
  body: z.string(),
  /** Para onde o clique leva — a tela do assunto. Nulo quando não há tela. */
  action: z.object({ label: z.string(), to: z.string().startsWith('/') }).nullable(),
  createdAt: z.iso.datetime(),
  /** Quando a pessoa leu; nulo enquanto é novidade. */
  readAt: z.iso.datetime().nullable(),
});

export type Notification = z.infer<typeof notificationSchema>;

export const NOTIFICATION_STATUSES = ['unread', 'read', 'all'] as const;

/** O histórico: paginado, porque são muitas, e com os filtros do perfil. */
export const notificationQuerySchema = paginationQuerySchema.extend({
  status: z.enum(NOTIFICATION_STATUSES).default('all'),
  severity: notificationSeveritySchema.optional(),
  topic: notificationTopicSchema.optional(),
  search: z.string().trim().max(120).optional(),
  from: z.iso.date().optional(),
  to: z.iso.date().optional(),
});

export type NotificationQuery = z.infer<typeof notificationQuerySchema>;

export const notificationPageSchema = paginatedSchema(notificationSchema);

/** O que o sininho e o diálogo precisam: as não lidas mais recentes e quantas são. */
export const notificationInboxSchema = z.object({
  items: z.array(notificationSchema),
  unread: z.number().int().min(0),
});

export type NotificationInbox = z.infer<typeof notificationInboxSchema>;

/**
 * Marcar como lidas de uma vez — o diálogo de entrada manda as que a pessoa passou, numa
 * gravação só. Só as da própria pessoa contam; as de outra são ignoradas.
 */
export const markNotificationsReadSchema = z.object({
  ids: z.array(z.uuid()).min(1).max(100),
});

export type MarkNotificationsReadInput = z.infer<typeof markNotificationsReadSchema>;

/** Quantas a gravação marcou — as que eram da pessoa e ainda não estavam lidas. */
export const notificationReadResultSchema = z.object({ updated: z.number().int().min(0) });

export type NotificationReadResult = z.infer<typeof notificationReadResultSchema>;

/** O que o administrador escolhe para um assunto: se o sistema notifica, e com que nível. */
export const notificationSettingSchema = z.object({
  topic: notificationTopicSchema,
  isEnabled: z.boolean(),
  severity: notificationSeveritySchema,
});

export type NotificationSetting = z.infer<typeof notificationSettingSchema>;

export const notificationSettingListSchema = z.object({
  items: z.array(notificationSettingSchema),
});

export type NotificationSettingList = z.infer<typeof notificationSettingListSchema>;

export const updateNotificationSettingsSchema = z.object({
  settings: z
    .array(notificationSettingSchema)
    .min(1)
    .max(NOTIFICATION_TOPIC_KEYS.length)
    .refine((items) => new Set(items.map((item) => item.topic)).size === items.length, {
      message: 'Cada assunto aparece uma vez só',
    }),
});

export type UpdateNotificationSettingsInput = z.infer<typeof updateNotificationSettingsSchema>;
