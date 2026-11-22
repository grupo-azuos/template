import { Inject, Injectable, Optional } from '@nestjs/common';
import { type HistoryDrillQuery } from '@template/shared/schemas/board-drill.schema';
import { type DataSourceKey } from '@template/shared/schemas/dashboard-board.schema';
import { type Paginated } from '@template/shared/schemas/pagination.schema';
import { type HistoryEntry } from '@template/shared/schemas/history.schema';
import { type SQL } from 'drizzle-orm';

import { type RequestUser } from '../../../lib/auth/request-user.type';
import { type HistoryRow } from '../../../lib/db/schema/history.schema';
import { assertCanRead } from '../../../lib/policy/policy-assert.util';
import { BOARD_DRILL, type BoardDrillResolver } from '../../dashboard-boards/board-drill.token';
import { HistoryRepository } from '../repository/history.repository';

/** A fonte do painel que esta lista sabe recortar: o movimento, que é o próprio histórico. */
const HISTORY_DRILL_SOURCES: readonly DataSourceKey[] = ['activity'];

/**
 * A LEITURA DO HISTÓRICO — a tela Histórico. Toda a equipe lê: é a resposta de "quem mudou
 * isso?". Quem fez sai pelo nome gravado na hora; sem nome, fica o e-mail.
 *
 * Separada do `HistoryService` de propósito: aquele grava, e todo módulo o usa; esta lê, e só a
 * tela precisa dela.
 */
@Injectable()
export class HistoryReadService {
  constructor(
    private readonly repository: HistoryRepository,
    @Optional() @Inject(BOARD_DRILL) private readonly drills?: BoardDrillResolver,
  ) {}

  async list(user: RequestUser, query: HistoryDrillQuery): Promise<Paginated<HistoryEntry>> {
    assertCanRead(user.role, 'o histórico');
    const actorId = query.actor === 'me' ? user.id : null;
    const page = await this.repository.list(query, actorId, await this.drillOf(user, query));

    return {
      items: page.rows.map(toHistoryEntry),
      total: page.total,
      page: query.page,
      pageSize: query.pageSize,
    };
  }

  /** O recorte de um clique no painel em SQL — sem recorte (ou sem o painel), nada. */
  private async drillOf(user: RequestUser, query: HistoryDrillQuery): Promise<SQL | undefined> {
    if (!query.drill || !this.drills) return undefined;

    return this.drills.drillCondition(user, query.drill, HISTORY_DRILL_SOURCES);
  }
}

export function toHistoryEntry(row: HistoryRow): HistoryEntry {
  return {
    id: String(row.id),
    action: row.action,
    target: { type: row.targetType, id: row.targetId, label: row.targetLabel },
    changes: row.changes,
    actor: { id: row.actorId, name: row.actorName ?? row.actorEmail },
    occurredAt: row.occurredAt.toISOString(),
  };
}
