import { type Archive, type ArchivedFilter } from '@template/shared/schemas/archive.schema';
import { isNotNull, isNull, type SQL } from 'drizzle-orm';
import { integer, type AnySQLiteColumn, text } from 'drizzle-orm/sqlite-core';

/**
 * As duas colunas do arquivamento, iguais em toda tabela que não se apaga (nada se apaga no
 * grupo: arquiva). Data em vez de booleano: responde de graça QUANDO.
 */
export function archiveColumns() {
  return {
    archivedAt: integer('archived_at', { mode: 'timestamp_ms' }),
    archivedBy: text('archived_by'),
  };
}

/** O filtro da lista: `hide` esconde, `only` traz só os arquivados, `show` não filtra. */
export function archivedCondition(column: AnySQLiteColumn, filter: ArchivedFilter): SQL | undefined {
  if (filter === 'show') return undefined;

  return filter === 'only' ? isNotNull(column) : isNull(column);
}

/** Os valores de arquivar (com quem) e de desarquivar (tudo nulo). */
export function archiveValues(
  archived: boolean,
  actorId: string | null,
): { archivedAt: Date | null; archivedBy: string | null } {
  return archived
    ? { archivedAt: new Date(), archivedBy: actorId }
    : { archivedAt: null, archivedBy: null };
}

/** A linha vira o bloco do contrato — nulo enquanto está em uso. */
export function toArchive(row: { archivedAt: Date | null; archivedBy: string | null }): Archive {
  if (!row.archivedAt) return null;

  return { archivedAt: row.archivedAt.toISOString(), archivedBy: row.archivedBy };
}
