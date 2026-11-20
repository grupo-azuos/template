import { Inject, Injectable } from '@nestjs/common';
import {
  type NotificationQuery,
  type NotificationSetting,
} from '@template/shared/schemas/notification.schema';
import {
  and,
  count,
  desc,
  eq,
  gte,
  inArray,
  isNotNull,
  isNull,
  lt,
  or,
  sql,
  type SQL,
} from 'drizzle-orm';

import { runQuery } from '../../../lib/db/db-error.util';
import { DB } from '../../../lib/db/db.token';
import { type Database } from '../../../lib/db/db.type';
import {
  type NotificationInsert,
  type NotificationRow,
  notifications,
  notificationSettings,
  type NotificationSettingRow,
} from '../../../lib/db/schema/notifications.schema';

/** O máximo que o sininho e o diálogo trazem de uma vez — o resto está no histórico. */
export const INBOX_LIMIT = 30;

/**
 * O repository não tem regra: traduz filtro em consulta e devolve linha. Quem decide se o
 * assunto está ligado, para quem vai e quem pode escolher é o service.
 */
@Injectable()
export class NotificationsRepository {
  constructor(@Inject(DB) private readonly db: Database) {}

  /**
   * Grava as notificações num comando só. A repetida (mesma pessoa, mesmo fato) não faz nada.
   * Devolve só as que eram novas — é por elas que o tempo real avisa.
   */
  async insertMany(values: readonly NotificationInsert[]): Promise<NotificationRow[]> {
    if (values.length === 0) return [];

    return runQuery(
      this.db
        .insert(notifications)
        .values([...values])
        .onConflictDoNothing({ target: [notifications.recipientId, notifications.dedupeKey] })
        .returning(),
      'gravar notificações',
    );
  }

  /** As não lidas mais recentes e quantas são — o sininho e o diálogo de entrada. */
  async inbox(recipientId: string): Promise<{ rows: NotificationRow[]; unread: number }> {
    const unread = and(eq(notifications.recipientId, recipientId), isNull(notifications.readAt));
    const [rows, [counted]] = await Promise.all([
      runQuery(
        this.db
          .select()
          .from(notifications)
          .where(unread)
          .orderBy(desc(notifications.createdAt))
          .limit(INBOX_LIMIT),
        'ler notificações não lidas',
      ),
      runQuery(
        this.db.select({ total: count() }).from(notifications).where(unread),
        'contar notificações não lidas',
      ),
    ]);

    return { rows, unread: counted?.total ?? rows.length };
  }

  /** O histórico da pessoa, com os filtros do perfil. */
  async page(
    recipientId: string,
    query: NotificationQuery,
  ): Promise<{ rows: NotificationRow[]; total: number }> {
    const where = and(eq(notifications.recipientId, recipientId), ...historyFilters(query));
    const [rows, [counted]] = await Promise.all([
      runQuery(
        this.db
          .select()
          .from(notifications)
          .where(where)
          .orderBy(desc(notifications.createdAt), desc(notifications.id))
          .limit(query.pageSize)
          .offset((query.page - 1) * query.pageSize),
        'listar notificações',
      ),
      runQuery(
        this.db.select({ total: count() }).from(notifications).where(where),
        'contar notificações',
      ),
    ]);

    return { rows, total: counted?.total ?? rows.length };
  }

  /** Marca como lida — só a da própria pessoa, e só a primeira leitura conta. */
  async markRead(recipientId: string, id: string, now: Date): Promise<NotificationRow | null> {
    const [row] = await runQuery(
      this.db
        .update(notifications)
        .set({ readAt: sql`coalesce(${notifications.readAt}, ${now.getTime()})` })
        .where(and(eq(notifications.id, id), eq(notifications.recipientId, recipientId)))
        .returning(),
      'marcar notificação como lida',
    );

    return row ?? null;
  }

  /**
   * Marca várias de uma vez, num comando só: ou todas ficam lidas, ou nenhuma. Só as da pessoa
   * que ainda não estavam lidas — a primeira leitura de cada uma é a que fica.
   */
  async markManyRead(recipientId: string, ids: readonly string[], now: Date): Promise<number> {
    const rows = await runQuery(
      this.db
        .update(notifications)
        .set({ readAt: now })
        .where(
          and(
            eq(notifications.recipientId, recipientId),
            inArray(notifications.id, [...ids]),
            isNull(notifications.readAt),
          ),
        )
        .returning({ id: notifications.id }),
      'marcar notificações como lidas',
    );

    return rows.length;
  }

  async markAllRead(recipientId: string, now: Date): Promise<number> {
    const rows = await runQuery(
      this.db
        .update(notifications)
        .set({ readAt: now })
        .where(and(eq(notifications.recipientId, recipientId), isNull(notifications.readAt)))
        .returning({ id: notifications.id }),
      'marcar todas como lidas',
    );

    return rows.length;
  }

  settings(): Promise<NotificationSettingRow[]> {
    return runQuery(this.db.select().from(notificationSettings), 'ler o que o sistema notifica');
  }

  /**
   * Grava a escolha de todos os assuntos numa transação: meio salvo é pior que não salvo. A
   * transação do SQLite é síncrona — por isso `.run()`, e nenhum `await` lá dentro.
   */
  async saveSettings(
    settings: readonly NotificationSetting[],
    actorId: string,
    now: Date,
  ): Promise<void> {
    await runQuery(
      Promise.resolve().then(() =>
        this.db.transaction((transaction) => {
          for (const setting of settings) {
            const values = {
              isEnabled: setting.isEnabled,
              severity: setting.severity,
              updatedAt: now,
              updatedBy: actorId,
            };
            transaction
              .insert(notificationSettings)
              .values({ topic: setting.topic, ...values })
              .onConflictDoUpdate({ target: notificationSettings.topic, set: values })
              .run();
          }
        }),
      ),
      'salvar o que o sistema notifica',
    );
  }
}

function historyFilters(query: NotificationQuery): SQL[] {
  const filters: (SQL | undefined)[] = [
    query.status === 'unread' ? isNull(notifications.readAt) : undefined,
    query.status === 'read' ? isNotNull(notifications.readAt) : undefined,
    query.severity ? eq(notifications.severity, query.severity) : undefined,
    query.topic ? eq(notifications.topic, query.topic) : undefined,
    query.from ? gte(notifications.createdAt, dayStart(query.from)) : undefined,
    query.to ? lt(notifications.createdAt, dayAfter(query.to)) : undefined,
    searchFilter(query.search),
  ];

  return filters.filter((filter): filter is SQL => filter !== undefined);
}

/**
 * `like` do SQLite já ignora maiúscula e minúscula das letras sem acento. `%` e `_` digitados
 * são texto, não curinga — por isso o `escape`.
 */
function searchFilter(search: string | undefined): SQL | undefined {
  if (!search) return undefined;
  const term = `%${search.replace(/[\\%_]/g, (char) => `\\${char}`)}%`;

  return or(
    sql`${notifications.title} like ${term} escape '\\'`,
    sql`${notifications.body} like ${term} escape '\\'`,
  );
}

/** O começo do dia pedido, no fuso da casa (Brasília). */
function dayStart(date: string): Date {
  return new Date(`${date}T00:00:00-03:00`);
}

/** O fim do dia pedido: "até 07/11" inclui a noite do dia 7. */
function dayAfter(date: string): Date {
  const end = dayStart(date);
  end.setUTCDate(end.getUTCDate() + 1);

  return end;
}
