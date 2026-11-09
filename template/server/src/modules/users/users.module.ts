import { Module } from '@nestjs/common';

import { UsersController } from './controller/users.controller';
import { UserDirectoryRepository } from './repository/user-directory.repository';
import { UserDirectoryService } from './service/user-directory.service';

/**
 * AS PESSOAS DO SISTEMA — base pronta para a integração com o admin-console, que só o suporte
 * liga. Pasta protegida: só o modo admin edita (ver `user-directory.repository.ts`).
 */
@Module({
  controllers: [UsersController],
  providers: [UserDirectoryService, UserDirectoryRepository],
  exports: [UserDirectoryService],
})
export class UsersModule {}
