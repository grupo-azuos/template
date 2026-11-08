import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { type RequestUser } from '../../../lib/auth/request-user.type';
import { type NotificationRow } from '../../../lib/db/schema/notifications.schema';
import { type NotificationsRepository } from '../repository/notifications.repository';
import { NotificationStreamService } from './notification-stream.service';
import { NotificationsService } from './notifications.service';

const ANA = 'ana-id';
const BIA = 'bia-id';
const user: RequestUser = { id: ANA, email: 'ana@exemplo.test', name: 'Ana', role: 'editor' };
const admin: RequestUser = { ...user, role: 'admin' };

const ROW: NotificationRow = {
  id: '0196f3e8-0000-7000-8000-00000000a001',
  recipientId: ANA,
  topic: 'system.release',
  severity: 'info',
  title: 'Versão 1.2.0 no ar',
  body: 'O sistema foi atualizado.',
  actionLabel: null,
  actionTo: null,
  dedupeKey: 'release:1.2.0',
  createdAt: new Date('2026-11-07T12:00:00.000Z'),
  readAt: null,
};

type Mock = ReturnType<typeof vi.fn>;
let repository: Record<string, Mock>;
let stream: NotificationStreamService;

function makeService(nodeEnv: 'test' | 'production' = 'test') {
  return new NotificationsService(repository as unknown as NotificationsRepository, stream, {
    NODE_ENV: nodeEnv,
  });
}

beforeEach(() => {
  repository = {
    insertMany: vi.fn().mockImplementation(async (values: unknown[]) => values),
    inbox: vi.fn().mockResolvedValue({ rows: [ROW], unread: 3 }),
    page: vi.fn().mockResolvedValue({ rows: [ROW], total: 1 }),
    markRead: vi.fn().mockResolvedValue({ ...ROW, readAt: new Date() }),
    markAllRead: vi.fn().mockResolvedValue(2),
    markManyRead: vi.fn().mockResolvedValue(2),
    settings: vi.fn().mockResolvedValue([]),
    saveSettings: vi.fn().mockResolvedValue(undefined),
  };
  stream = new NotificationStreamService();
});

const INPUT = {
  topic: 'system.release' as const,
  title: 'Versão nova',
  body: 'O sistema foi atualizado.',
  dedupeKey: 'release:1.2.0',
};

describe('NotificationsService.notify', () => {
  // feliz
  it('grava para cada pessoa, menos quem causou o fato, e avisa o tempo real', async () => {
    const announced: string[] = [];
    stream.streamFor(BIA).subscribe(() => announced.push(BIA));

    const created = await makeService().notify({
      ...INPUT,
      recipients: [ANA, BIA, BIA],
      exceptId: ANA,
    });

    expect(created).toBe(1);
    expect(repository.insertMany).toHaveBeenCalledWith([
      expect.objectContaining({ recipientId: BIA, severity: 'info', dedupeKey: 'release:1.2.0' }),
    ]);
    expect(announced).toEqual([BIA]);
  });

  // feliz
  it('respeita o administrador: assunto desligado não notifica, e o nível escolhido vale', async () => {
    repository.settings!.mockResolvedValue([
      { topic: 'system.release', isEnabled: true, severity: 'urgent' },
    ]);
    const service = makeService();

    await service.notify({ ...INPUT, recipients: [ANA] });
    expect(repository.insertMany).toHaveBeenCalledWith([
      expect.objectContaining({ severity: 'urgent' }),
    ]);

    repository.settings!.mockResolvedValue([
      { topic: 'system.release', isEnabled: false, severity: 'info' },
    ]);
    await service.saveSettings(admin, {
      settings: [{ topic: 'system.release', isEnabled: false, severity: 'info' }],
    });
    await expect(service.notify({ ...INPUT, recipients: [ANA] })).resolves.toBe(0);
  });

  // triste
  it('não derruba quem notifica: banco recusando vira 0, e não erro', async () => {
    repository.insertMany!.mockRejectedValue(new Error('disk full'));

    await expect(makeService().notify({ ...INPUT, recipients: [ANA] })).resolves.toBe(0);
  });
});

describe('NotificationsService — a pessoa lê as dela', () => {
  // feliz
  it('entrega o sininho e marca lida', async () => {
    const service = makeService();

    await expect(service.inbox(user)).resolves.toMatchObject({ unread: 3 });
    await expect(service.markRead(user, ROW.id)).resolves.toMatchObject({ id: ROW.id });
    expect(repository.markRead).toHaveBeenCalledWith(ANA, ROW.id, expect.any(Date));
    await expect(service.markManyRead(user, ['a', 'b'])).resolves.toBe(2);
    await expect(service.markAllRead(user)).resolves.toBe(2);
    await expect(
      service.page(user, { page: 1, pageSize: 20, status: 'all' }),
    ).resolves.toMatchObject({ total: 1, items: [{ id: ROW.id }] });
  });

  // feliz
  it('fora do teste, a caixa traz a versão nova uma vez, pela trava da versão', async () => {
    await makeService('production').inbox(user);

    expect(repository.insertMany).toHaveBeenCalledWith([
      expect.objectContaining({
        recipientId: ANA,
        topic: 'system.release',
        dedupeKey: expect.stringMatching(/^release:/),
      }),
    ]);
  });

  // triste
  it('a notificação de outra pessoa responde como inexistente', async () => {
    repository.markRead!.mockResolvedValue(null);

    await expect(makeService().markRead(user, ROW.id)).rejects.toBeInstanceOf(NotFoundException);
  });
});

describe('NotificationsService — o que o sistema notifica', () => {
  // feliz
  it('o administrador vê os assuntos com o padrão e grava a escolha', async () => {
    const service = makeService();

    await expect(service.settings(admin)).resolves.toEqual([
      { topic: 'system.release', isEnabled: true, severity: 'info' },
    ]);
    await service.saveSettings(admin, {
      settings: [{ topic: 'system.release', isEnabled: false, severity: 'info' }],
    });
    expect(repository.saveSettings).toHaveBeenCalledWith(
      [{ topic: 'system.release', isEnabled: false, severity: 'info' }],
      ANA,
      expect.any(Date),
    );
  });

  // triste
  it('quem não é administrador não vê nem grava', async () => {
    const service = makeService();

    await expect(service.settings(user)).rejects.toBeInstanceOf(ForbiddenException);
    await expect(
      service.saveSettings(user, {
        settings: [{ topic: 'system.release', isEnabled: false, severity: 'info' }],
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
