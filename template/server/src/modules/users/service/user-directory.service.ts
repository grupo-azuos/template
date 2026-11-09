import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { type DirectoryList } from '@template/shared/schemas/user-directory.schema';

import { type RequestUser } from '../../../lib/auth/request-user.type';
import { assertCanRead } from '../../../lib/policy/policy-assert.util';
import { UserDirectoryRepository } from '../repository/user-directory.repository';

/**
 * QUEM PODE SER ESCOLHIDO NUM CAMPO DE PESSOA.
 *
 * Integração desligada (o padrão do template): só quem está logado — o sistema funciona e o
 * seletor de pessoa aparece, só que com uma pessoa. Ligada pelo suporte: a lista do
 * admin-console, ordenada por nome. Ligada e fora do ar: 503, e não lista vazia.
 */
@Injectable()
export class UserDirectoryService {
  constructor(private readonly repository: UserDirectoryRepository) {}

  async list(user: RequestUser): Promise<DirectoryList> {
    assertCanRead(user.role, 'as pessoas do sistema');
    if (!this.repository.isConnected()) {
      return {
        people: [{ id: user.id, name: user.name, email: user.email, avatarUrl: null }],
        isConnected: false,
      };
    }

    const people = await this.repository.findPeople();
    if (!people) {
      throw new ServiceUnavailableException(
        'Não consegui ler a lista de pessoas do sistema de acessos.',
      );
    }

    return {
      people: [...people].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR')),
      isConnected: true,
    };
  }
}
