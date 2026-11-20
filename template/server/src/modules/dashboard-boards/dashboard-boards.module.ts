import { Module } from '@nestjs/common';

import { HistoryModule } from '../history/history.module';
import { UsersModule } from '../users/users.module';
import { DashboardBoardsController } from './controller/dashboard-boards.controller';
import { DashboardBoardsRepository } from './repository/dashboard-boards.repository';
import { DashboardBoardsService } from './service/dashboard-boards.service';

/**
 * Os dashboards montados (Equipe, Gestor, Pessoal) e os filtros salvos do sistema — o motor
 * padrão do grupo (regra `dashboard-standard`). Pasta protegida: só o suporte muda.
 */
@Module({
  imports: [UsersModule, HistoryModule],
  controllers: [DashboardBoardsController],
  providers: [DashboardBoardsService, DashboardBoardsRepository],
})
export class DashboardBoardsModule {}
