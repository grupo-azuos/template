import { sql } from 'drizzle-orm';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { type OpenDatabase, openDatabase } from '../../../lib/db/open-database.util';
import { dashboardBoards } from '../../../lib/db/schema/dashboard-boards.schema';
import { history } from '../../../lib/db/schema/history.schema';
import { tasks, type TaskInsert } from '../../../lib/db/schema/tasks.schema';
import { DashboardBoardsRepository } from './dashboard-boards.repository';
import { InvalidFilterError } from './filter-sql.util';
import { SOURCE_TABLES } from './widget-sources';

/* Banco de verdade, em memória: o SQL de contagem, de filtro e de dia de Brasília é o que está
   em teste — um repositório fingido não prova que ele roda no SQLite. */
let opened: OpenDatabase;
let repository: DashboardBoardsRepository;

function task(overrides: Partial<TaskInsert> = {}): TaskInsert {
  return {
    title: 'Ligar para o cliente',
    status: 'todo',
    createdBy: 'ana@empresa.com.br',
    createdAt: new Date('2026-11-09T12:00:00.000Z'),
    ...overrides,
  };
}

const status = { key: 'status', expression: SOURCE_TABLES.tasks.dimensions.status!, isTime: false };

beforeAll(() => {
  opened = openDatabase(':memory:');
  repository = new DashboardBoardsRepository(opened.db);
});

beforeEach(async () => {
  await opened.db.delete(tasks);
  await opened.db.delete(history);
  await opened.db.delete(dashboardBoards);
});

afterAll(() => {
  opened.close();
});

describe('DashboardBoardsRepository.countBy', () => {
  // feliz
  it('counts the cut, the whole source and each group, the biggest first', async () => {
    await opened.db.insert(tasks).values([
      task({ status: 'done' }),
      task({ status: 'done' }),
      task({ status: 'todo', createdBy: 'bia@empresa.com.br' }),
    ]);

    const counted = await repository.countBy(SOURCE_TABLES.tasks, {
      tree: { combinator: 'and', rules: [{ field: 'createdBy', operator: '=', value: 'ana@empresa.com.br' }] },
      extra: undefined,
      dimension: status,
      split: null,
    });

    expect(counted).toMatchObject({ total: 2, grandTotal: 3 });
    expect(counted.groups).toEqual([{ key: 'done', value: 2 }]);
  });

  // feliz
  it('crosses two categories and groups by month in Brasília', async () => {
    await opened.db.insert(tasks).values([
      task({ status: 'done', createdAt: new Date('2026-11-01T02:00:00.000Z') }),
      task({ status: 'todo', createdAt: new Date('2026-11-15T12:00:00.000Z') }),
    ]);

    const counted = await repository.countBy(SOURCE_TABLES.tasks, {
      tree: null,
      extra: undefined,
      dimension: {
        key: 'createdMonth',
        expression: SOURCE_TABLES.tasks.dimensions.createdMonth!,
        isTime: true,
      },
      split: { key: 'createdBy', expression: SOURCE_TABLES.tasks.dimensions.createdBy!, isTime: false },
    });

    /* 02:00 UTC do dia 1º ainda é 31 de outubro em Brasília. */
    expect(counted.groups).toEqual([
      { key: '2026-10', value: 1 },
      { key: '2026-11', value: 1 },
    ]);
    expect(counted.cells).toHaveLength(2);
  });

  // feliz
  it('counts the movement from the history, only on tasks', async () => {
    await opened.db.insert(history).values([
      { action: 'task.created', targetType: 'task', targetId: '1', actorId: 'u-ana' },
      { action: 'task.updated', targetType: 'task', targetId: '1', actorId: 'u-ana' },
      { action: 'other.created', targetType: 'other', targetId: '9', actorId: 'u-ana' },
    ]);

    const counted = await repository.countBy(SOURCE_TABLES.activity, {
      tree: null,
      extra: sql`1 = 1`,
      dimension: { key: 'action', expression: SOURCE_TABLES.activity.dimensions.action!, isTime: false },
      split: null,
    });

    expect(counted.grandTotal).toBe(2);
  });

  // triste
  it('keeps a typed value as text, never as SQL, and refuses an unknown field', async () => {
    await opened.db.insert(tasks).values(task());

    const counted = await repository.countBy(SOURCE_TABLES.tasks, {
      tree: {
        combinator: 'and',
        rules: [{ field: 'createdBy', operator: 'contains', value: "x'; drop table tasks;--" }],
      },
      extra: undefined,
      dimension: null,
      split: null,
    });

    expect(counted).toMatchObject({ total: 0, grandTotal: 1 });
    await expect(
      repository.countBy(SOURCE_TABLES.tasks, {
        tree: { combinator: 'and', rules: [{ field: 'senha', operator: '=', value: 'x' }] },
        extra: undefined,
        dimension: null,
        split: null,
      }),
    ).rejects.toThrow(InvalidFilterError);
  });
});

describe('DashboardBoardsRepository boards', () => {
  // feliz
  it('keeps a single team board: the second save replaces the first', async () => {
    const board = { widgets: [], layout: [], filters: [] };
    await repository.saveBoard('team', null, board, 'u-ana');
    await repository.saveBoard('team', null, { ...board, filters: [{ id: 'p', kind: 'period', label: 'Período' }] }, 'u-bia');

    const rows = await opened.db.select().from(dashboardBoards);

    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ ownerId: '', updatedBy: 'u-bia' });
  });

  // triste
  it('finds nothing for a person who never saved a personal board', async () => {
    await expect(repository.findBoard('personal', 'u-caio')).resolves.toBeNull();
  });
});
