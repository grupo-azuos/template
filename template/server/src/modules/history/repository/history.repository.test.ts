import { historyQuerySchema } from '@template/shared/schemas/history.schema';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { type OpenDatabase, openDatabase } from '../../../lib/db/open-database.util';
import { history, type HistoryInsert } from '../../../lib/db/schema/history.schema';
import { HistoryRepository } from './history.repository';

/* Banco de verdade, em memória: é a consulta do Drizzle que está em teste — o filtro por dia de
   Brasília, a ordem e a paginação precisam virar o SQL certo. */
let opened: OpenDatabase;
let repository: HistoryRepository;

function entry(overrides: Partial<HistoryInsert> = {}): HistoryInsert {
  return {
    action: 'task.updated',
    targetType: 'task',
    targetId: '1',
    targetLabel: 'Ligar para o cliente',
    changes: [{ field: 'Status', from: 'todo', to: 'done' }],
    actorId: 'ana',
    actorEmail: 'ana@empresa.com.br',
    actorName: 'Ana',
    occurredAt: new Date('2026-11-09T12:00:00.000Z'),
    ...overrides,
  };
}

const query = (overrides: Record<string, unknown> = {}) => historyQuerySchema.parse(overrides);

beforeAll(() => {
  opened = openDatabase(':memory:');
  repository = new HistoryRepository(opened.db);
});

beforeEach(async () => {
  await opened.db.delete(history);
});

afterAll(() => {
  opened.close();
});

describe('HistoryRepository', () => {
  // feliz
  it('writes a line and reads it back, newest first, with the changes as they were', async () => {
    await repository.insert(entry({ occurredAt: new Date('2026-11-08T12:00:00.000Z') }));
    await repository.insert(entry({ targetLabel: 'Mais nova' }));

    const page = await repository.list(query(), null);

    expect(page.total).toBe(2);
    expect(page.rows[0]).toMatchObject({
      targetLabel: 'Mais nova',
      changes: [{ field: 'Status', from: 'todo', to: 'done' }],
    });
  });

  it('filters by who did it, the action and a text in the target name', async () => {
    await repository.insert(entry());
    await repository.insert(entry({ actorId: 'bia', targetLabel: 'Revisar contrato' }));
    await repository.insert(entry({ action: 'task.created', targetLabel: 'Revisar proposta' }));

    const mine = await repository.list(query(), 'bia');
    const created = await repository.list(query({ action: 'task.created' }), null);
    const searched = await repository.list(query({ search: 'revisar' }), null);

    expect(mine.rows.map((row) => row.targetLabel)).toEqual(['Revisar contrato']);
    expect(created.total).toBe(1);
    expect(searched.total).toBe(2);
  });

  /* 02:00 UTC do dia 10 ainda é dia 09 em Brasília: o filtro de período fala do dia de quem usa. */
  it('cuts the period by the Brasília day, including the whole last day', async () => {
    await repository.insert(entry({ occurredAt: new Date('2026-11-10T02:00:00.000Z') }));
    await repository.insert(entry({ occurredAt: new Date('2026-11-10T04:00:00.000Z') }));

    const page = await repository.list(query({ from: '2026-11-09', to: '2026-11-09' }), null);

    expect(page.total).toBe(1);
  });

  // triste
  it('returns an empty page, not an error, when nothing matches', async () => {
    await repository.insert(entry());

    const page = await repository.list(query({ search: 'nada disso' }), null);

    expect(page).toEqual({ rows: [], total: 0 });
  });
});
