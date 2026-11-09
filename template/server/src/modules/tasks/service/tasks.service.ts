import { Injectable, NotFoundException } from '@nestjs/common';
import { type Paginated } from '@template/shared/schemas/pagination.schema';
import {
  type CreateTaskInput,
  type Task,
  type TaskListQuery,
  type UpdateTaskInput,
} from '@template/shared/schemas/task.schema';

import { type RequestUser } from '../../../lib/auth/request-user.type';
import { type TaskInsert } from '../../../lib/db/schema/tasks.schema';
import {
  assertCanDelete,
  assertCanEdit,
  assertCanRead,
} from '../../../lib/policy/policy-assert.util';
import { diffFields } from '../../history/mapper/history.mapper';
import { HistoryService } from '../../history/service/history.service';
import { toTask, toTaskInsert, toTaskUpdate } from '../mapper/tasks.mapper';
import { TasksRepository } from '../repository/tasks.repository';

/** O nome de cada campo na linha do histórico — a tela nunca mostra `status`. */
const HISTORY_FIELDS = { title: 'Título', description: 'Descrição', status: 'Status' };

/**
 * Só o que a edição TROUXE entra na comparação. Campo que não veio não mudou — compará-lo com
 * `undefined` faria o histórico dizer que o título foi apagado numa troca de status.
 */
function sentFields(update: Partial<TaskInsert>): Partial<Record<keyof typeof HISTORY_FIELDS, unknown>> {
  const fields = { title: update.title, description: update.description, status: update.status };

  return Object.fromEntries(Object.entries(fields).filter(([, value]) => value !== undefined));
}

const NOT_FOUND = 'Tarefa não encontrada. Ela pode ter sido excluída — recarregue a lista.';

/**
 * O ÚNICO caminho de escrita de tarefa. Controller não fala com repository, e o repository
 * não decide nada.
 *
 * A policy é chamada AQUI, colada na escrita, e não num passo separado: esquecer de chamar a
 * policy é uma porta aberta, e ela fica mais difícil de esquecer no mesmo lugar do `insert`.
 */
@Injectable()
export class TasksService {
  constructor(
    private readonly repository: TasksRepository,
    private readonly history: HistoryService,
  ) {}

  async list(user: RequestUser, query: TaskListQuery): Promise<Paginated<Task>> {
    assertCanRead(user.role, 'as tarefas');

    const page = await this.repository.list(query);

    return {
      items: page.rows.map(toTask),
      total: page.total,
      page: query.page,
      pageSize: query.pageSize,
    };
  }

  async findById(user: RequestUser, id: number): Promise<Task> {
    assertCanRead(user.role, 'as tarefas');

    const row = await this.repository.findById(id);
    if (!row) throw new NotFoundException(NOT_FOUND);

    return toTask(row);
  }

  async create(user: RequestUser, input: CreateTaskInput): Promise<Task> {
    assertCanEdit(user.role, 'as tarefas');

    const row = await this.repository.insert(toTaskInsert(input, user.email));
    await this.history.record({
      actor: user,
      action: 'task.created',
      targetType: 'task',
      targetId: row.id,
      targetLabel: row.title,
    });

    return toTask(row);
  }

  async update(user: RequestUser, id: number, input: UpdateTaskInput): Promise<Task> {
    assertCanEdit(user.role, 'as tarefas');

    const current = await this.repository.findById(id);
    if (!current) throw new NotFoundException(NOT_FOUND);

    const update = toTaskUpdate(input, user.email);
    const row = await this.repository.update(id, update);
    await this.history.recordIfChanged({
      actor: user,
      action: 'task.updated',
      targetType: 'task',
      targetId: id,
      targetLabel: row.title,
      changes: diffFields(
        { title: current.title, description: current.description, status: current.status },
        sentFields(update),
        HISTORY_FIELDS,
      ),
    });

    return toTask(row);
  }

  async remove(user: RequestUser, id: number): Promise<void> {
    assertCanDelete(user.role, 'tarefas');

    const current = await this.repository.findById(id);
    if (!current) throw new NotFoundException(NOT_FOUND);

    await this.repository.delete(id);
    await this.history.record({
      actor: user,
      action: 'task.deleted',
      targetType: 'task',
      targetId: id,
      targetLabel: current.title,
    });
  }
}
