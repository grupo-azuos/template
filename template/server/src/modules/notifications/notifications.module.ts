import { Module } from '@nestjs/common';

import { NotificationsController } from './controller/notifications.controller';
import { NotificationsRepository } from './repository/notifications.repository';
import { NotificationStreamService } from './service/notification-stream.service';
import { NotificationsService } from './service/notifications.service';

/**
 * As notificações: quem gera importa este módulo e chama `NotificationsService.notify`; a tela
 * lê pelo sininho, pelo diálogo de entrada, pelo fluxo em tempo real e pelo histórico.
 */
@Module({
  controllers: [NotificationsController],
  providers: [NotificationsService, NotificationsRepository, NotificationStreamService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
