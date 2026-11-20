import { Controller, Get, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../../../lib/auth/current-user.decorator';
import { type RequestUser } from '../../../lib/auth/request-user.type';
import { HistoryPageDto, HistoryQueryDto } from '../dto/history.dto';
import { HistoryReadService } from '../service/history-read.service';

/** O HISTÓRICO — quem mudou o quê e quando, no sistema inteiro. Só leitura: ele só cresce. */
@ApiTags('Histórico')
@Controller('history')
export class HistoryController {
  constructor(private readonly history: HistoryReadService) {}

  @Get()
  @ApiOperation({
    summary: 'A linha do tempo do sistema',
    description:
      'Da mais nova para a mais antiga, paginada. Filtra por tipo do alvo, ação, quem fez (`actor=me` é quem pede), período em dias (`from`/`to`) e texto no nome do alvo.',
  })
  @ApiOkResponse({ type: HistoryPageDto })
  async list(
    @CurrentUser() user: RequestUser,
    @Query() query: HistoryQueryDto,
  ): Promise<HistoryPageDto> {
    return this.history.list(user, query);
  }
}
