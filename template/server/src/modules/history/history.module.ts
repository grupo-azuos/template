import { Module } from '@nestjs/common';

import { HistoryController } from './controller/history.controller';
import { HistoryRepository } from './repository/history.repository';
import { HistoryReadService } from './service/history-read.service';
import { HistoryService } from './service/history.service';

/**
 * `HistoryService` é exportado porque os outros módulos registram por ele — é o que mantém um
 * caminho único para escrever auditoria. O repository não sai daqui.
 *
 * A leitura (`GET /history`) é da tela Histórico, e fica num service à parte.
 */
@Module({
  controllers: [HistoryController],
  providers: [HistoryService, HistoryReadService, HistoryRepository],
  exports: [HistoryService],
})
export class HistoryModule {}
