import { Injectable } from '@nestjs/common';
import { type Paginated } from '@template/shared/schemas/pagination.schema';
import { type HistoryEntry, type HistoryQuery } from '@template/shared/schemas/history.schema';

import { type RequestUser } from '../../../lib/auth/request-user.type';
import { type HistoryRow } from '../../../lib/db/schema/history.schema';
import { assertCanRead } from '../../../lib/policy/policy-assert.util';
import { HistoryRepository } from '../repository/history.repository';

/**
 * A LEITURA DO HISTÓRICO — a tela Histórico. Toda a equipe lê: é a resposta de "quem mudou
 * isso?". Quem fez sai pelo nome gravado na hora; sem nome, fica o e-mail.
 *
 * Separada do `HistoryService` de propósito: aquele grava, e todo módulo o usa; esta lê, e só a
 * tela precisa dela.
 */
@Injectable()
export class HistoryReadService {
  constructor(private readonly repository: HistoryRepository) {}

  async list(user: RequestUser, query: HistoryQuery): Promise<Paginated<HistoryEntry>> {
    assertCanRead(user.role, 'o histórico');
    const actorId = query.actor === 'me' ? user.id : null;
    const page = await this.repository.list(query, actorId);

    return {
      items: page.rows.map(toHistoryEntry),
      total: page.total,
      page: query.page,
      pageSize: query.pageSize,
    };
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
