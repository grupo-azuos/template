import { type HistoryChange } from '@template/shared/schemas/history.schema';
import { sql } from 'drizzle-orm';
import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

/**
 * A LINHA DO TEMPO DESTE SISTEMA — quem mudou o quê, quando, com o valor antes e depois.
 *
 * Só cresce, nunca é reescrita: não há rota de edição nem de exclusão.
 *
 * - `action` e `target_type` são texto: a lista fechada é do contrato (`history.schema.ts` do
 *   shared), e uma trava aqui pediria migration a cada ação nova sem proteger nada que o
 *   TypeScript já não proteja.
 * - `target_id` é texto porque o alvo pode ter id numérico ou uuid.
 * - `target_label`, `actor_email` e `actor_name` são o que valia NA HORA: o registro pode mudar
 *   de nome, e o histórico conta o que a pessoa viu.
 * - Sem chave estrangeira para o alvo: ele pode ter sido excluído, e a linha que explica a
 *   exclusão não pode sumir com ele.
 */
export const history = sqliteTable(
  'history',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    action: text('action').notNull(),
    targetType: text('target_type').notNull(),
    targetId: text('target_id').notNull(),
    targetLabel: text('target_label'),
    changes: text('changes', { mode: 'json' }).$type<HistoryChange[]>().notNull().default([]),
    actorId: text('actor_id'),
    actorEmail: text('actor_email'),
    actorName: text('actor_name'),
    occurredAt: integer('occurred_at', { mode: 'timestamp_ms' })
      .notNull()
      .default(sql`(cast(unixepoch('subsec') * 1000 as integer))`),
  },
  (table) => [
    index('history_target_idx').on(table.targetType, table.targetId),
    index('history_occurred_at_idx').on(table.occurredAt),
  ],
);

export type HistoryRow = typeof history.$inferSelect;
export type HistoryInsert = typeof history.$inferInsert;
