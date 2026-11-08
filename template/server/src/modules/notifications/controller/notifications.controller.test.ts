import { notificationQuerySchema } from '@template/shared/schemas/notification.schema';
import { firstValueFrom, take, toArray } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';

import { type RequestUser } from '../../../lib/auth/request-user.type';
import { NotificationStreamService } from '../service/notification-stream.service';
import { type NotificationsService } from '../service/notifications.service';
import { NotificationsController } from './notifications.controller';

const ana: RequestUser = { id: 'ana-id', email: 'ana@empresa.com.br', name: 'Ana', role: 'admin' };

/* O controller só compõe: identidade + corpo vão para o service, e a resposta volta no
   formato do contrato. A regra de quem pode o quê mora no service, e é testada lá. */
function controllerWith() {
  const service = {
    page: vi.fn().mockResolvedValue({ items: [], total: 0, page: 1, pageSize: 20 }),
    inbox: vi.fn().mockResolvedValue({ items: [], unread: 0 }),
    markRead: vi.fn().mockResolvedValue({ id: 'n1' }),
    markManyRead: vi.fn().mockResolvedValue(2),
    markAllRead: vi.fn().mockResolvedValue(5),
    settings: vi.fn().mockResolvedValue([]),
    saveSettings: vi.fn().mockResolvedValue([]),
  };
  const stream = new NotificationStreamService();

  return {
    service,
    stream,
    controller: new NotificationsController(service as unknown as NotificationsService, stream),
  };
}

describe('NotificationsController', () => {
  // feliz
  it('lê, marca e escolhe pelo service, sempre com quem está logado', async () => {
    const { service, controller } = controllerWith();
    const query = notificationQuerySchema.parse({ status: 'unread' });

    await expect(controller.page(ana, query)).resolves.toMatchObject({ total: 0 });
    await expect(controller.inbox(ana)).resolves.toEqual({ items: [], unread: 0 });
    await expect(controller.markRead(ana, 'n1')).resolves.toEqual({ id: 'n1' });
    await expect(controller.markManyRead(ana, { ids: ['n1'] })).resolves.toEqual({ updated: 2 });
    await expect(controller.markAllRead(ana)).resolves.toEqual({ updated: 5 });
    await expect(controller.settings(ana)).resolves.toEqual({ items: [] });
    await expect(controller.saveSettings(ana, { settings: [] })).resolves.toEqual({ items: [] });
    expect(service.page).toHaveBeenCalledWith(ana, query);
  });

  // triste
  it('o fluxo só avisa a pessoa da notificação, e não a dos outros', async () => {
    const { stream, controller } = controllerWith();
    const events = firstValueFrom(controller.streamOf(ana).pipe(take(1), toArray()));

    stream.announce('bia-id');
    stream.announce('ana-id');

    await expect(events).resolves.toEqual([
      { type: 'notification', data: { type: 'notification' } },
    ]);
  });
});
