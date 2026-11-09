import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
  Sse,
  type MessageEvent,
} from '@nestjs/common';
import {
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';

import { interval, map, merge, type Observable } from 'rxjs';

import { CurrentUser } from '../../../lib/auth/current-user.decorator';
import { type RequestUser } from '../../../lib/auth/request-user.type';
import { HistoryService } from '../../history/service/history.service';
import {
  BoardResourceDto,
  BoardScopeParamsDto,
  SaveBoardDto,
  SavedFilterListDto,
  SavedFilterQueryDto,
  SavedFilterResourceDto,
  SaveFilterDto,
  WidgetDataResourceDto,
  WidgetQueryDto,
} from '../dto/dashboard-boards.dto';
import { DashboardBoardsService } from '../service/dashboard-boards.service';

/** Um sinal vazio de tempos em tempos: proxy nenhum fecha a conexão por silêncio. */
const HEARTBEAT_MS = 25_000;

/**
 * OS DASHBOARDS MONTADOS e os FILTROS SALVOS. Três painéis — Equipe, Gestor, Pessoal —, cada
 * um um canvas de até 10 blocos; os filtros são do sistema e servem a qualquer bloco.
 */
@ApiTags('Dashboards')
@Controller()
export class DashboardBoardsController {
  constructor(
    private readonly boards: DashboardBoardsService,
    private readonly history: HistoryService,
  ) {}

  /* Antes de `:scope`: senão "stream" seria lido como o nome de um painel. */
  @Sse('dashboard-boards/stream')
  @ApiOperation({
    summary: 'Avisa na hora que os números mudaram',
    description:
      'Server-Sent Events. Cada evento `dashboard` diz que algo foi gravado no sistema (toda escrita entra no histórico) — a tela relê os blocos. No máximo um a cada 3 s; um `ping` a cada 25 s mantém a conexão aberta.',
  })
  changes(): Observable<MessageEvent> {
    return merge(
      this.history.changes().pipe(map((data) => ({ type: 'dashboard', data }))),
      interval(HEARTBEAT_MS).pipe(map(() => ({ type: 'ping', data: {} }))),
    );
  }

  @Get('dashboard-boards/:scope')
  @ApiOperation({
    summary: 'Um dashboard: Equipe, Gestor ou Pessoal',
    description:
      'O que foi montado, ou o painel padrão enquanto ninguém montou. `canEdit` diz se quem pede pode mudar.',
  })
  @ApiOkResponse({ type: BoardResourceDto })
  @ApiForbiddenResponse({ description: 'O dashboard do gestor é do gestor e do administrador.' })
  async board(
    @CurrentUser() user: RequestUser,
    @Param() params: BoardScopeParamsDto,
  ): Promise<BoardResourceDto> {
    return { data: { board: await this.boards.board(user, params.scope) }, links: {} };
  }

  @Put('dashboard-boards/:scope')
  @ApiOperation({
    summary: 'Salva o dashboard',
    description:
      'Os blocos (até 10) e o lugar de cada um no canvas de 4 colunas. Equipe e Gestor: gestor e administrador.',
  })
  @ApiOkResponse({ type: BoardResourceDto })
  @ApiForbiddenResponse({ description: 'Quem pede não edita este dashboard.' })
  @ApiUnprocessableEntityResponse({
    description: 'Bloco inválido, ou filtro que não pode ser usado.',
  })
  async saveBoard(
    @CurrentUser() user: RequestUser,
    @Param() params: BoardScopeParamsDto,
    @Body() body: SaveBoardDto,
  ): Promise<BoardResourceDto> {
    return { data: { board: await this.boards.saveBoard(user, params.scope, body) }, links: {} };
  }

  @Post('dashboard-boards/data')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Os números de um bloco',
    description:
      'A fonte contada, com o filtro salvo, e agrupada se pedido. Os arquivados não entram.',
  })
  @ApiOkResponse({ type: WidgetDataResourceDto })
  @ApiUnprocessableEntityResponse({ description: 'Agrupamento ou filtro que esta fonte não tem.' })
  async data(
    @CurrentUser() user: RequestUser,
    @Body() body: WidgetQueryDto,
  ): Promise<WidgetDataResourceDto> {
    return { data: { result: await this.boards.data(user, body) }, links: {} };
  }

  @Get('dashboard-filters')
  @ApiOperation({
    summary: 'Os filtros salvos que a pessoa vê',
    description: 'Os dela e os compartilhados. `?archived=show|only` traz os arquivados.',
  })
  @ApiOkResponse({ type: SavedFilterListDto })
  async filters(
    @CurrentUser() user: RequestUser,
    @Query() query: SavedFilterQueryDto,
  ): Promise<SavedFilterListDto> {
    const filters = await this.boards.filters(user, query.archived);

    return { data: { filters }, meta: { totalItems: filters.length }, links: {} };
  }

  @Post('dashboard-filters')
  @ApiOperation({ summary: 'Salva um filtro novo' })
  @ApiOkResponse({ type: SavedFilterResourceDto })
  async createFilter(
    @CurrentUser() user: RequestUser,
    @Body() body: SaveFilterDto,
  ): Promise<SavedFilterResourceDto> {
    return { data: { filter: await this.boards.createFilter(user, body) }, links: {} };
  }

  @Put('dashboard-filters/:id')
  @ApiOperation({
    summary: 'Muda um filtro salvo',
    description: 'Só quem criou, ou gestor e administrador no compartilhado.',
  })
  @ApiOkResponse({ type: SavedFilterResourceDto })
  @ApiNotFoundResponse({ description: 'Filtro não encontrado.' })
  async updateFilter(
    @CurrentUser() user: RequestUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: SaveFilterDto,
  ): Promise<SavedFilterResourceDto> {
    return { data: { filter: await this.boards.updateFilter(user, id, body) }, links: {} };
  }

  @Delete('dashboard-filters/:id')
  @ApiOperation({
    summary: 'Arquiva um filtro',
    description: 'Não apaga: `POST .../restore` o traz de volta.',
  })
  @ApiOkResponse({ type: SavedFilterResourceDto })
  async archiveFilter(
    @CurrentUser() user: RequestUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<SavedFilterResourceDto> {
    return { data: { filter: await this.boards.setFilterArchived(user, id, true) }, links: {} };
  }

  @Post('dashboard-filters/:id/restore')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Desarquiva um filtro' })
  @ApiOkResponse({ type: SavedFilterResourceDto })
  async restoreFilter(
    @CurrentUser() user: RequestUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<SavedFilterResourceDto> {
    return { data: { filter: await this.boards.setFilterArchived(user, id, false) }, links: {} };
  }
}
