import { HealthController } from './lib/http/health.controller';
import { ValkeyModule } from './lib/cache/valkey.module';
import { join } from 'node:path';

import { Module } from '@nestjs/common';
import { APP_PIPE } from '@nestjs/core';
import { ServeStaticModule } from '@nestjs/serve-static';

import { AuthModule } from './lib/auth/auth.module';
import { AppConfigModule } from './lib/config/app-config.module';
import { DbModule } from './lib/db/db.module';
import { HistoryModule } from './modules/history/history.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { TasksModule } from './modules/tasks/tasks.module';
import { UsersModule } from './modules/users/users.module';
import { ZodValidationPipe } from './lib/http/zod-validation.pipe';

/**
 * Serve o build do client — sem Nginx, sem container à parte. Atrás do Traefik, esta
 * imagem responde `/` (SPA) e `/api/v1` (Nest) sozinha. Em desenvolvimento a pasta não existe
 * (o Vite serve o client em :5173), e o `express.static` por baixo simplesmente devolve 404
 * em silêncio — não derruba o boot.
 */
const CLIENT_DIST = join(__dirname, '..', '..', 'client', 'dist');

/**
 * O pipe de validação é global: requisição com corpo fora do contrato é recusada antes de
 * chegar ao controller, e a resposta nomeia o campo. Dizer "dados inválidos" sem dizer qual
 * campo obriga a pessoa a adivinhar, e ela desiste antes de acertar.
 *
 * MÓDULO NOVO ENTRA NA LISTA DE `imports`. Esquecer é o motivo nº 1 de "a rota dá 404".
 */
@Module({
  imports: [
    ValkeyModule,
    ServeStaticModule.forRoot({
      rootPath: CLIENT_DIST,
      exclude: ['/api/{*path}', '/docs', '/docs/{*path}', '/docs-json'],
    }),
    AppConfigModule,
    /* `@Global` só vale a partir do momento em que o módulo é registrado UMA vez. Sem esta
       linha o token `DB` não existe em lugar nenhum, e todo repository falha na injeção. */
    DbModule,
    AuthModule,
    HistoryModule,
    TasksModule,
    NotificationsModule,
    UsersModule,
  ],
  controllers: [HealthController],
  providers: [{ provide: APP_PIPE, useClass: ZodValidationPipe }],
})
export class AppModule {}
