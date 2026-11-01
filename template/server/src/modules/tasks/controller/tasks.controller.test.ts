import { taskListQuerySchema } from '@template/shared/schemas/task.schema';
import { describe, expect, it, vi } from 'vitest';

import { type RequestUser } from '../../../lib/auth/request-user.type';
import { type CreateTaskDto, type UpdateTaskDto } from '../dto/task.dto';
import { type TasksService } from '../service/tasks.service';
import { TasksController } from './tasks.controller';

const ana: RequestUser = { id: '1', email: 'ana@empresa.com.br', name: 'Ana', role: 'editor' };

/* O controller só compõe: identidade + corpo + id vão para o service, e a resposta volta
   como veio. A regra de quem pode o quê mora no service, e é testada lá. */
function controllerWith() {
  const service = {
    list: vi.fn().mockResolvedValue({ items: [], total: 0, page: 1, pageSize: 50 }),
    findById: vi.fn().mockResolvedValue({ id: 3, title: 'Ligar' }),
    create: vi.fn().mockResolvedValue({ id: 4, title: 'Nova' }),
    update: vi.fn().mockResolvedValue({ id: 3, title: 'Mudou' }),
    remove: vi.fn().mockResolvedValue(undefined),
  };

  return { service, controller: new TasksController(service as unknown as TasksService) };
}

describe('TasksController', () => {
  // feliz
  it('passes the list query through with the identity', async () => {
    const { service, controller } = controllerWith();
    const query = taskListQuerySchema.parse({ status: 'todo' });

    await expect(controller.list(ana, query)).resolves.toMatchObject({ total: 0 });
    expect(service.list).toHaveBeenCalledWith(ana, query);
  });

  it('reads, creates, updates and removes through the service', async () => {
    const { service, controller } = controllerWith();
    const body = { title: 'Nova' } as CreateTaskDto;
    const patch = { title: 'Mudou' } as UpdateTaskDto;

    await expect(controller.findById(ana, 3)).resolves.toMatchObject({ id: 3 });
    await expect(controller.create(ana, body)).resolves.toMatchObject({ id: 4 });
    await expect(controller.update(ana, 3, patch)).resolves.toMatchObject({ title: 'Mudou' });
    await expect(controller.remove(ana, 3)).resolves.toBeUndefined();

    expect(service.findById).toHaveBeenCalledWith(ana, 3);
    expect(service.create).toHaveBeenCalledWith(ana, body);
    expect(service.update).toHaveBeenCalledWith(ana, 3, patch);
    expect(service.remove).toHaveBeenCalledWith(ana, 3);
  });

  // triste
  it('lets a refusal of the service reach the caller untouched', async () => {
    const { service, controller } = controllerWith();
    service.remove.mockRejectedValueOnce(new Error('Excluir tarefas é uma ação de administrador.'));

    await expect(controller.remove(ana, 3)).rejects.toThrow('ação de administrador');
  });
});
