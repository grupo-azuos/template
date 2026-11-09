import { Inject, Injectable } from '@nestjs/common';
import { type HistoryQuery } from '@template/shared/schemas/history.schema';
import { and, count, desc, eq, gte, like, lt, type SQL } from 'drizzle-orm';

import { runQuery } from '../../../lib/db/db-error.util';
import { DB } from '../../../lib/db/db.token';
import { type Database } from '../../../lib/db/db.type';
import {
  history,
  type HistoryInsert,
  type HistoryRow,
} from '../../../lib/db/schema/history.schema';

/**
 * A LINHA DO TEMPO DESTE BANCO. Escreve e lê: a tela Histórico pagina da mais nova para a mais
 * antiga, com os filtros da tela. Não há `update` nem `delete` — o histórico só cresce.
 */
@Injectable()
export class HistoryRepository {
  constructor(@Inject(DB) private readonly db: Database) {}

  /** Quem chama trata a falha: ver `HistoryService.record`. */
  async insert(entry: HistoryInsert): Promise<void> {
    await runQuery(this.db.insert(history).values(entry), 'registrar histórico');
  }

  /** A página pedida e o total do recorte. `actorId` já vem resolvido (o "me" é quem pede). */
  async list(
    query: HistoryQuery,
    actorId: string | null,
  ): Promise<{ rows: HistoryRow[]; total: number }> {
    const where = whereOf(query, actorId);
    const [rows, [counted]] = await Promise.all([
      runQuery(
        this.db
          .select()
          .from(history)
          .where(where)
          .orderBy(desc(history.occurredAt), desc(history.id))
          .limit(query.pageSize)
          .offset((query.page - 1) * query.pageSize),
        'listar o histórico',
      ),
      runQuery(this.db.select({ total: count() }).from(history).where(where), 'contar o histórico'),
    ]);

    return { rows, total: counted?.total ?? 0 };
  }
}

/** O começo de um dia em Brasília (UTC−3, sem horário de verão desde 2019). */
function startOfDay(day: string): Date {
  return new Date(`${day}T00:00:00-03:00`);
}

/** O começo do dia SEGUINTE: "até 09/11" inclui o dia 09 inteiro. */
function endOfDay(day: string): Date {
  const next = startOfDay(day);
  next.setUTCDate(next.getUTCDate() + 1);

  return next;
}

/** O recorte: cada filtro vira uma condição, e o que não veio não entra. */
function whereOf(query: HistoryQuery, actorId: string | null): SQL | undefined {
  return and(
    query.targetType ? eq(history.targetType, query.targetType) : undefined,
    query.action ? eq(history.action, query.action) : undefined,
    actorId ? eq(history.actorId, actorId) : undefined,
    query.from ? gte(history.occurredAt, startOfDay(query.from)) : undefined,
    query.to ? lt(history.occurredAt, endOfDay(query.to)) : undefined,
    query.search ? like(history.targetLabel, `%${query.search}%`) : undefined,
  );
}
