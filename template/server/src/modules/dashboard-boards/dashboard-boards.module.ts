import { Global, Module } from '@nestjs/common';

import { HistoryModule } from '../history/history.module';
import { UsersModule } from '../users/users.module';
import { BOARD_DRILL } from './board-drill.token';
import { DashboardBoardsController } from './controller/dashboard-boards.controller';
import { DashboardBoardsRepository } from './repository/dashboard-boards.repository';
import { DashboardBoardsService } from './service/dashboard-boards.service';

/**
 * Os dashboards montados (Equipe, Gestor, Pessoal) e os filtros salvos do sistema — o motor
 * padrão do grupo (regra `dashboard-standard`). Pasta protegida: só o suporte muda.
 *
 * Global por causa do recorte (`BOARD_DRILL`): as telas de destino de um clique no painel — as
 * tarefas, o histórico — pedem a condição do bloco sem importar este módulo (o que fecharia um
 * ciclo).
 */
@Global()
@Module({
  imports: [UsersModule, HistoryModule],
  controllers: [DashboardBoardsController],
  providers: [
    DashboardBoardsService,
    DashboardBoardsRepository,
    { provide: BOARD_DRILL, useExisting: DashboardBoardsService },
  ],
  exports: [BOARD_DRILL],
})
export class DashboardBoardsModule {}
