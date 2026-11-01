import { taskListQuerySchema } from '@template/shared/schemas/task.schema';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { type OpenDatabase, openDatabase } from '../../../lib/db/open-database.util';
import { tasks, type TaskInsert } from '../../../lib/db/schema/tasks.schema';
import { TasksRepository } from './tasks.repository';

/* Banco de verdade, em memória: é a consulta do Drizzle que está em teste, e um repositório
   fingido não prova que o filtro, a ordem e a paginação viram SQL certo. */
let opened: OpenDatabase;
let repository: TasksRepository;

function values(overrides: Partial<TaskInsert> = {}): TaskInsert {
  return {
    title: 'Ligar para o cliente',
    description: null,
    status: 'todo',
    createdAt: new Date('2026-09-14T12:00:00.000Z'),
    createdBy: 'ana@empresa.com.br',
    ...overrides,
  };
}

beforeAll(() => {
  opened = openDatabase(':memory:');
  repository = new TasksRepository(opened.db);
});

beforeEach(async () => {
  await opened.db.delete(tasks);
});

afterAll(() => {
  opened.close();
});

describe('TasksRepository', () => {
  // feliz
  it('inserts a task and reads it back by id', async () => {
    const inserted = await repository.insert(values());

    expect(inserted).toMatchObject({ title: 'Ligar para o cliente', status: 'todo' });
    expect(await repository.findById(inserted.id)).toEqual(inserted);
  });

  it('lists the newest first, with the total of the whole table', async () => {
    await repository.insert(values({ title: 'Primeira', createdAt: new Date('2026-09-14') }));
    await repository.insert(values({ title: 'Segunda', createdAt: new Date('2026-09-15') }));

    const page = await repository.list(taskListQuerySchema.parse({}));

    expect(page.total).toBe(2);
    expect(page.rows.map((row) => row.title)).toEqual(['Segunda', 'Primeira']);
  });

  it('filters by status and by a term in the title or the description', async () => {
    await repository.insert(values({ title: 'Revisar contrato', status: 'done' }));
    await repository.insert(values({ title: 'Outra', description: 'contrato antigo' }));
    await repository.insert(values({ title: 'Sem relação' }));

    const done = await repository.list(taskListQuerySchema.parse({ status: 'done' }));
    const found = await repository.list(taskListQuerySchema.parse({ search: 'contrato' }));

    expect(done.rows.map((row) => row.title)).toEqual(['Revisar contrato']);
    expect(found.total).toBe(2);
  });

  it('pages the query itself, counting all rows and returning only the page', async () => {
    for (let i = 1; i <= 3; i += 1) {
      await repository.insert(values({ title: `Tarefa ${i}`, createdAt: new Date(2026, 8, i) }));
    }

    const second = await repository.list(taskListQuerySchema.parse({ page: 2, pageSize: 2 }));

    expect(second.total).toBe(3);
    expect(second.rows.map((row) => row.title)).toEqual(['Tarefa 1']);
  });

  it('updates only the given fields and deletes by id', async () => {
    const inserted = await repository.insert(values());

    const updated = await repository.update(inserted.id, { status: 'doing' });
    expect(updated).toMatchObject({
      id: inserted.id,
      title: 'Ligar para o cliente',
      status: 'doing',
    });

    await repository.delete(inserted.id);
    expect(await repository.findById(inserted.id)).toBeNull();
  });

  // triste
  it('answers null for an id that does not exist, instead of throwing', async () => {
    expect(await repository.findById(999)).toBeNull();
  });

  it('turns a value the database refuses into an HTTP error, not a raw SQLite error', async () => {
    await expect(
      repository.insert(values({ status: 'inventado' as TaskInsert['status'] })),
    ).rejects.toMatchObject({ status: 422 });
  });
});
