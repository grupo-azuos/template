import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
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
} from '@nestjs/swagger';
import { interval, map, merge, type Observable } from 'rxjs';

import { CurrentUser } from '../../../lib/auth/current-user.decorator';
import { type RequestUser } from '../../../lib/auth/request-user.type';
import { Roles } from '../../../lib/auth/roles.decorator';
import {
  MarkNotificationsReadDto,
  NotificationDto,
  NotificationInboxDto,
  NotificationPageDto,
  NotificationQueryDto,
  NotificationReadResultDto,
  NotificationSettingListDto,
  UpdateNotificationSettingsDto,
} from '../dto/notifications.dto';
import { NotificationStreamService } from '../service/notification-stream.service';
import { NotificationsService } from '../service/notifications.service';

/** Um sinal vazio de tempos em tempos: proxy nenhum fecha a conexão por silêncio. */
const HEARTBEAT_MS = 25_000;

/**
 * AS NOTIFICAÇÕES DE QUEM ESTÁ LOGADO — sempre as DELE: nenhuma rota recebe de quem são.
 * O que o sistema notifica (`settings`) é do administrador.
 */
@ApiTags('Notificações')
@Controller('notifications')
export class NotificationsController {
  constructor(
    private readonly notifications: NotificationsService,
    private readonly stream: NotificationStreamService,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'O histórico de notificações',
    description:
      'Paginado, da mais nova para a mais antiga, com filtros: `status` (unread, read, all), `severity`, `topic`, `search` (título e texto) e o período `from`/`to`.',
  })
  @ApiOkResponse({ type: NotificationPageDto })
  async page(
    @CurrentUser() user: RequestUser,
    @Query() query: NotificationQueryDto,
  ): Promise<NotificationPageDto> {
    return this.notifications.page(user, query);
  }

  @Get('inbox')
  @ApiOperation({
    summary: 'As não lidas — o sininho e o diálogo de entrada',
    description: 'As 30 mais recentes não lidas, e em `unread` quantas são ao todo.',
  })
  @ApiOkResponse({ type: NotificationInboxDto })
  async inbox(@CurrentUser() user: RequestUser): Promise<NotificationInboxDto> {
    return this.notifications.inbox(user);
  }

  @Sse('stream')
  @ApiOperation({
    summary: 'Avisa na hora que chegou notificação nova',
    description:
      'Server-Sent Events. Cada evento `notification` diz que há novidade — a tela busca `inbox`. Um `ping` a cada 25 s mantém a conexão aberta.',
  })
  streamOf(@CurrentUser() user: RequestUser): Observable<MessageEvent> {
    return merge(
      this.stream.streamFor(user.id).pipe(map((data) => ({ type: 'notification', data }))),
      interval(HEARTBEAT_MS).pipe(map(() => ({ type: 'ping', data: {} }))),
    );
  }

  @Patch(':id/read')
  @ApiOperation({
    summary: 'Marca uma notificação como lida',
    description: 'Só a primeira leitura conta.',
  })
  @ApiOkResponse({ type: NotificationDto })
  @ApiNotFoundResponse({ description: 'Não há notificação sua com esse identificador.' })
  async markRead(
    @CurrentUser() user: RequestUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<NotificationDto> {
    return this.notifications.markRead(user, id);
  }

  @Post('read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Marca várias como lidas, de uma vez',
    description:
      'O diálogo de entrada manda as que a pessoa passou, numa gravação só. Id de outra pessoa é ignorado; a resposta diz quantas eram dela.',
  })
  @ApiOkResponse({ type: NotificationReadResultDto })
  async markManyRead(
    @CurrentUser() user: RequestUser,
    @Body() body: MarkNotificationsReadDto,
  ): Promise<NotificationReadResultDto> {
    return { updated: await this.notifications.markManyRead(user, body.ids) };
  }

  @Post('read-all')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Marca todas as não lidas como lidas' })
  @ApiOkResponse({ type: NotificationReadResultDto })
  async markAllRead(@CurrentUser() user: RequestUser): Promise<NotificationReadResultDto> {
    return { updated: await this.notifications.markAllRead(user) };
  }

  @Get('settings')
  @Roles('admin')
  @ApiOperation({
    summary: 'O que o sistema notifica',
    description: 'Cada assunto, ligado ou não, com o nível. O que ninguém mexeu vem com o padrão.',
  })
  @ApiOkResponse({ type: NotificationSettingListDto })
  @ApiForbiddenResponse({ description: 'Ação de administrador.' })
  async settings(@CurrentUser() user: RequestUser): Promise<NotificationSettingListDto> {
    return { items: await this.notifications.settings(user) };
  }

  @Put('settings')
  @Roles('admin')
  @ApiOperation({ summary: 'Escolhe o que o sistema notifica, e com que nível' })
  @ApiOkResponse({ type: NotificationSettingListDto })
  @ApiForbiddenResponse({ description: 'Ação de administrador.' })
  async saveSettings(
    @CurrentUser() user: RequestUser,
    @Body() body: UpdateNotificationSettingsDto,
  ): Promise<NotificationSettingListDto> {
    return { items: await this.notifications.saveSettings(user, body) };
  }
}
