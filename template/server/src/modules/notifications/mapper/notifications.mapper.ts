import {
  NOTIFICATION_TOPIC_KEYS,
  NOTIFICATION_TOPICS,
  type Notification,
  type NotificationSetting,
  type NotificationTopic,
} from '@template/shared/schemas/notification.schema';

import {
  type NotificationRow,
  type NotificationSettingRow,
} from '../../../lib/db/schema/notifications.schema';

export function toNotification(row: NotificationRow): Notification {
  return {
    id: row.id,
    topic: row.topic as NotificationTopic,
    severity: row.severity,
    title: row.title,
    body: row.body,
    action: row.actionLabel && row.actionTo ? { label: row.actionLabel, to: row.actionTo } : null,
    createdAt: row.createdAt.toISOString(),
    readAt: row.readAt?.toISOString() ?? null,
  };
}

/**
 * O que o sistema notifica, assunto por assunto: o que o administrador gravou, e o padrão do
 * contrato para o que ninguém mexeu. Linha de assunto que saiu do contrato é ignorada.
 */
export function toSettings(rows: readonly NotificationSettingRow[]): NotificationSetting[] {
  const saved = new Map(rows.map((row) => [row.topic, row]));

  return NOTIFICATION_TOPIC_KEYS.map((topic) => {
    const row = saved.get(topic);

    return {
      topic,
      isEnabled: row?.isEnabled ?? true,
      severity: row?.severity ?? NOTIFICATION_TOPICS[topic].severity,
    };
  });
}
