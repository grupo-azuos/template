import { NOTIFICATION_SEVERITIES } from '@template/shared/schemas/notification.schema';
import { sql } from 'drizzle-orm';
import { index, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

/**
 * AS NOTIFICAÇÕES DE CADA PESSOA — uma linha por pessoa por notificação.
 *
 * Só crescem: ler carimba `read_at`, e nada é apagado. O histórico do perfil é esta tabela.
 *
 * `dedupe_key` é a trava da repetição: o mesmo fato (a versão 1.2.0 subiu) para a mesma pessoa
 * vira UMA notificação, por mais que o aviso seja pedido de novo.
 *
 * `recipient_id` é o id da identidade (auth-forward), e não e-mail: e-mail muda, e a
 * notificação de quem trocou de e-mail sumiria do sininho dela.
 */
export const notifications = sqliteTable(
  'notifications',
  {
    /* uuid gerado no service: a tela marca como lida pelo id, e id sequencial seria adivinhável. */
    id: text('id').primaryKey(),
    recipientId: text('recipient_id').notNull(),
    topic: text('topic').notNull(),
    severity: text('severity', { enum: NOTIFICATION_SEVERITIES }).notNull(),
    title: text('title').notNull(),
    body: text('body').notNull(),
    actionLabel: text('action_label'),
    actionTo: text('action_to'),
    dedupeKey: text('dedupe_key').notNull(),
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .notNull()
      .default(sql`(cast(unixepoch('subsec') * 1000 as integer))`),
    readAt: integer('read_at', { mode: 'timestamp_ms' }),
  },
  (table) => [
    uniqueIndex('notifications_recipient_dedupe_idx').on(table.recipientId, table.dedupeKey),
    /* O sininho e o histórico leem por pessoa, da mais nova para a mais velha. */
    index('notifications_recipient_created_idx').on(table.recipientId, table.createdAt),
  ],
);

export type NotificationRow = typeof notifications.$inferSelect;
export type NotificationInsert = typeof notifications.$inferInsert;

/**
 * O QUE O SISTEMA NOTIFICA — uma linha por assunto, escolhida pelo administrador. Assunto sem
 * linha vale o padrão do contrato (`NOTIFICATION_TOPICS`).
 */
export const notificationSettings = sqliteTable('notification_settings', {
  topic: text('topic').primaryKey(),
  isEnabled: integer('is_enabled', { mode: 'boolean' }).notNull(),
  severity: text('severity', { enum: NOTIFICATION_SEVERITIES }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull(),
  updatedBy: text('updated_by'),
});

export type NotificationSettingRow = typeof notificationSettings.$inferSelect;
