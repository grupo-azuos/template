import { type INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { AppModule } from '../src/app.module';
import { setupApp } from '../src/app.setup';
import { MOCK_IDENTITY } from '../src/lib/auth/identity.provider';
import { parseEnv } from '../src/lib/config/env.schema';
import { NotificationsService } from '../src/modules/notifications/service/notifications.service';

/**
 * As notificações de ponta a ponta, contra um SQLite de verdade em memória: migration, trava da
 * repetição, "só as minhas", a primeira leitura e a escolha do administrador.
 */
describe('Notifications API (e2e)', () => {
  let app: INestApplication;
  let notifications: NotificationsService;

  beforeAll(async () => {
    process.env.DATABASE_FILE = ':memory:';
    process.env.API_LOG_LEVEL = 'error';

    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication({ logger: ['error'] });
    setupApp(app, parseEnv(process.env));
    await app.init();
    notifications = app.get(NotificationsService);
  });

  afterAll(async () => {
    await app.close();
  });

  // feliz
  it('o que foi gerado para a pessoa aparece na caixa dela, uma vez por fato', async () => {
    const inboxBefore = await request(app.getHttpServer())
      .get('/api/v1/notifications/inbox')
      .expect(200);
    const before = inboxBefore.body.unread as number;

    const input = {
      topic: 'system.release' as const,
      /* A pessoa fixa do servidor de desenvolvimento, e outra que não é quem pergunta. */
      recipients: [MOCK_IDENTITY.id, 'outra-pessoa'],
      title: 'Versão 9.9.9 no ar',
      body: 'O sistema foi atualizado.',
      action: { label: 'Abrir as tarefas', to: '/tasks' },
      dedupeKey: 'release:9.9.9',
    };
    expect(await notifications.notify(input)).toBe(2);
    expect(await notifications.notify(input)).toBe(0);

    const inbox = await request(app.getHttpServer()).get('/api/v1/notifications/inbox').expect(200);
    expect(inbox.body.unread).toBe(before + 1);
    expect(inbox.body.items[0]).toMatchObject({
      title: 'Versão 9.9.9 no ar',
      action: { label: 'Abrir as tarefas', to: '/tasks' },
      readAt: null,
    });

    const read = await request(app.getHttpServer())
      .post('/api/v1/notifications/read')
      .send({ ids: [inbox.body.items[0].id] })
      .expect(200);
    expect(read.body).toEqual({ updated: 1 });

    const history = await request(app.getHttpServer())
      .get('/api/v1/notifications?status=read&search=9.9.9')
      .expect(200);
    expect(history.body.total).toBe(1);
  });

  // feliz
  it('o administrador escolhe o nível de cada assunto', async () => {
    const saved = await request(app.getHttpServer())
      .put('/api/v1/notifications/settings')
      .send({ settings: [{ topic: 'system.release', isEnabled: true, severity: 'urgent' }] })
      .expect(200);

    expect(saved.body.items).toEqual([
      { topic: 'system.release', isEnabled: true, severity: 'urgent' },
    ]);
  });

  // triste
  it('recusa assunto que não existe e id que não é uuid', async () => {
    await request(app.getHttpServer())
      .put('/api/v1/notifications/settings')
      .send({ settings: [{ topic: 'outro', isEnabled: true, severity: 'urgent' }] })
      .expect((response) => expect(response.status).toBeGreaterThanOrEqual(400));
    await request(app.getHttpServer())
      .patch('/api/v1/notifications/nao-e-uuid/read')
      .expect((response) => expect(response.status).toBeGreaterThanOrEqual(400));
  });
});
