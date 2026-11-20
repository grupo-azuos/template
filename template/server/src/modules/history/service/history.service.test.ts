import { historyQuerySchema } from '@template/shared/schemas/history.schema';
import { ForbiddenException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';

import { type RequestUser } from '../../../lib/auth/request-user.type';
import { type HistoryRepository } from '../repository/history.repository';
import { HistoryReadService } from './history-read.service';
import { HistoryService } from './history.service';

const ana: RequestUser = { id: 'ana', email: 'ana@empresa.com.br', name: 'Ana', role: 'user' };

describe('HistoryService', () => {
  // feliz
  it('stamps the author from the identity, never from who calls', async () => {
    const insert = vi.fn().mockResolvedValue(undefined);
    const service = new HistoryService({ insert } as unknown as HistoryRepository);

    await service.record({ actor: ana, action: 'task.created', targetType: 'task', targetId: 7 });

    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({ targetId: '7', actorId: 'ana', actorName: 'Ana', changes: [] }),
    );
  });

  // triste
  it('does not undo the main write when the history line fails', async () => {
    const insert = vi.fn().mockRejectedValue(new Error('disk full'));
    const service = new HistoryService({ insert } as unknown as HistoryRepository);

    await expect(
      service.record({ actor: ana, action: 'task.created', targetType: 'task', targetId: 7 }),
    ).resolves.toBeUndefined();
  });

  it('writes nothing when nothing changed', async () => {
    const insert = vi.fn();
    const service = new HistoryService({ insert } as unknown as HistoryRepository);

    await service.recordIfChanged({
      actor: ana,
      action: 'task.updated',
      targetType: 'task',
      targetId: 7,
      changes: [],
    });

    expect(insert).not.toHaveBeenCalled();
  });
});

describe('HistoryReadService', () => {
  const row = {
    id: 3,
    action: 'task.updated',
    targetType: 'task',
    targetId: '7',
    targetLabel: 'Ligar',
    changes: [],
    actorId: 'ana',
    actorEmail: 'ana@empresa.com.br',
    actorName: null,
    occurredAt: new Date('2026-11-09T12:00:00.000Z'),
  };

  // feliz
  it('turns "me" into who asks and falls back to the e-mail without a name', async () => {
    const list = vi.fn().mockResolvedValue({ rows: [row], total: 1 });
    const service = new HistoryReadService({ list } as unknown as HistoryRepository);

    const page = await service.list(ana, historyQuerySchema.parse({ actor: 'me' }));

    expect(list).toHaveBeenCalledWith(expect.anything(), 'ana');
    expect(page.items[0]).toMatchObject({ id: '3', actor: { name: 'ana@empresa.com.br' } });
  });

  // triste
  it('refuses someone without a role in the system', async () => {
    const service = new HistoryReadService({ list: vi.fn() } as unknown as HistoryRepository);

    await expect(
      service.list({ ...ana, role: null as never }, historyQuerySchema.parse({})),
    ).rejects.toThrow(ForbiddenException);
  });
});
