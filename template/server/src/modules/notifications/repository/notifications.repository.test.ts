import { notificationQuerySchema } from '@template/shared/schemas/notification.schema';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { type OpenDatabase, openDatabase } from '../../../lib/db/open-database.util';
import {
  type NotificationInsert,
  notifications,
  notificationSettings,
} from '../../../lib/db/schema/notifications.schema';
import { NotificationsRepository } from './notifications.repository';

/* Banco de verdade, em memória: a trava da repetição, o filtro e a "primeira leitura" são SQL,
   e um repositório fingido não prova nada disso. */
let opened: OpenDatabase;
let repository: NotificationsRepository;

const ANA = 'ana-id';
const BIA = 'bia-id';
const NOW = new Date('2026-11-07T15:00:00.000Z');

let sequence = 0;
function values(overrides: Partial<NotificationInsert> = {}): NotificationInsert {
  sequence += 1;

  return {
    id: `00000000-0000-4000-8000-${String(sequence).padStart(12, '0')}`,
    recipientId: ANA,
    topic: 'system.release',
    severity: 'info',
    title: 'Versão 1.2.0 no ar',
    body: 'O sistema foi atualizado.',
    dedupeKey: `release:${sequence}`,
    createdAt: new Date('2026-11-07T12:00:00.000Z'),
    ...overrides,
  };
}

beforeAll(() => {
  opened = openDatabase(':memory:');
  repository = new NotificationsRepository(opened.db);
});

beforeEach(async () => {
  await opened.db.delete(notifications);
  await opened.db.delete(notificationSettings);
});

afterAll(() => {
  opened.close();
});

describe('NotificationsRepository', () => {
  // feliz
  it('writes, reads the person inbox and counts the unread', async () => {
    await repository.insertMany([values(), values(), values({ recipientId: BIA })]);

    const inbox = await repository.inbox(ANA);

    expect(inbox.unread).toBe(2);
    expect(inbox.rows.every((row) => row.recipientId === ANA)).toBe(true);
  });

  // triste
  it('does not turn the same fact for the same person into two notifications', async () => {
    await repository.insertMany([values({ dedupeKey: 'release:1.2.0' })]);
    const again = await repository.insertMany([values({ dedupeKey: 'release:1.2.0' })]);

    expect(again).toEqual([]);
    expect((await repository.inbox(ANA)).unread).toBe(1);
  });

  // feliz
  it('marks read only the person own, keeping the first reading', async () => {
    const [mine] = await repository.insertMany([values()]);
    const first = await repository.markRead(ANA, mine!.id, NOW);
    const second = await repository.markRead(ANA, mine!.id, new Date('2026-12-01'));

    expect(first?.readAt).toEqual(NOW);
    expect(second?.readAt).toEqual(NOW);
    // triste
    expect(await repository.markRead(BIA, mine!.id, NOW)).toBeNull();
  });

  // feliz
  it('marks several and all at once, without touching another person ones', async () => {
    const [first, second] = await repository.insertMany([values(), values()]);
    const [other] = await repository.insertMany([values({ recipientId: BIA })]);

    expect(await repository.markManyRead(ANA, [first!.id, other!.id], NOW)).toBe(1);
    expect(await repository.markAllRead(ANA, NOW)).toBe(1);
    expect((await repository.inbox(ANA)).unread).toBe(0);
    expect((await repository.inbox(BIA)).unread).toBe(1);
    expect(second).toBeDefined();
  });

  // feliz
  it('filters the history by situation, text and period', async () => {
    await repository.insertMany([
      values({ title: 'Versão 100% nova', createdAt: new Date('2026-11-05T12:00:00.000Z') }),
      values({ title: 'Outra', createdAt: new Date('2026-11-07T12:00:00.000Z') }),
    ]);

    const bySearch = await repository.page(ANA, notificationQuerySchema.parse({ search: '100%' }));
    const byPeriod = await repository.page(
      ANA,
      notificationQuerySchema.parse({ from: '2026-11-06', to: '2026-11-07' }),
    );
    const read = await repository.page(ANA, notificationQuerySchema.parse({ status: 'read' }));

    expect(bySearch.rows.map((row) => row.title)).toEqual(['Versão 100% nova']);
    expect(byPeriod.total).toBe(1);
    // triste
    expect(read.total).toBe(0);
  });

  // feliz
  it('saves the administrator choice, replacing the previous one for the subject', async () => {
    await repository.saveSettings(
      [{ topic: 'system.release', isEnabled: false, severity: 'info' }],
      ANA,
      NOW,
    );
    await repository.saveSettings(
      [{ topic: 'system.release', isEnabled: true, severity: 'urgent' }],
      ANA,
      NOW,
    );

    expect(await repository.settings()).toEqual([
      expect.objectContaining({ topic: 'system.release', isEnabled: true, severity: 'urgent' }),
    ]);
  });
});
