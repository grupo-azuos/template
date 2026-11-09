import { Controller, Get } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiServiceUnavailableResponse,
  ApiTags,
} from '@nestjs/swagger';
import { directoryListSchema } from '@template/shared/schemas/user-directory.schema';

import { CurrentUser } from '../../../lib/auth/current-user.decorator';
import { type RequestUser } from '../../../lib/auth/request-user.type';
import { createZodDto } from '../../../lib/http/zod-dto';
import { UserDirectoryService } from '../service/user-directory.service';

class DirectoryListDto extends createZodDto(directoryListSchema) {}

@ApiTags('Pessoas')
@Controller('users')
export class UsersController {
  constructor(private readonly directory: UserDirectoryService) {}

  @Get()
  @ApiOperation({
    summary: 'Quem pode ser escolhido num campo de pessoa',
    description:
      'Lida do admin-console quando o suporte liga a integração (`ADMIN_CONSOLE_URL` e `ADMIN_CONSOLE_CLIENT_SECRET`); desligada, traz só quem está logado e `isConnected: false`. Responde **503** quando está ligada e a lista não pôde ser lida.',
  })
  @ApiOkResponse({ type: DirectoryListDto })
  @ApiServiceUnavailableResponse({ description: 'A lista de pessoas não pôde ser lida.' })
  async list(@CurrentUser() user: RequestUser): Promise<DirectoryListDto> {
    return this.directory.list(user);
  }
}
