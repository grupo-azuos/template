import { Inject, Injectable, Logger } from '@nestjs/common';
import { type DirectoryPerson } from '@template/shared/schemas/user-directory.schema';

import { serviceAuthorization } from '../../../lib/auth/oauth-token.client';
import { type Env } from '../../../lib/config/env.schema';
import { ENV } from '../../../lib/config/env.token';

/**
 * A LEITURA DE QUEM TEM ACESSO A ESTE SISTEMA, no admin-console (`GET /systems/me/access`).
 *
 * A INTEGRAÇÃO É DO SUPORTE. Esta pasta é protegida (`scripts/git/protected-auth.txt`): só o
 * modo admin a edita, e ela só fala com o admin-console quando o suporte configura
 * `ADMIN_CONSOLE_URL` e `ADMIN_CONSOLE_CLIENT_SECRET` (o token sai da tela do Admin Console).
 * Sem os dois, ela nem tenta — e quem pede recebe só a pessoa logada.
 *
 * Três respostas, de propósito: a lista; `[]` quando o admin-console respondeu e não há
 * ninguém; e `null` quando não deu para saber. "Não sei quem são" e "não há ninguém" levam a
 * decisões opostas na tela.
 */
type AccessResponse = {
  data?: {
    people?: {
      id?: unknown;
      name?: unknown;
      email?: unknown;
      presentation?: { avatarUrl?: unknown } | null;
    }[];
  };
};

@Injectable()
export class UserDirectoryRepository {
  private readonly logger = new Logger(UserDirectoryRepository.name);

  constructor(@Inject(ENV) private readonly env: Env) {}

  /** O suporte ligou a integração? Sem os dois valores, não há o que perguntar. */
  isConnected(): boolean {
    return !!this.env.ADMIN_CONSOLE_URL && !!this.env.ADMIN_CONSOLE_CLIENT_SECRET;
  }

  async findPeople(): Promise<DirectoryPerson[] | null> {
    if (!this.isConnected()) return null;

    const base = (this.env.ADMIN_CONSOLE_URL as string).replace(/\/$/, '');
    try {
      const response = await fetch(`${base}/api/v1/systems/me/access`, {
        headers: { accept: 'application/json', authorization: await serviceAuthorization(this.env) },
        signal: AbortSignal.timeout(this.env.ADMIN_CONSOLE_TIMEOUT_MS),
      });
      if (!response.ok) {
        this.logger.warn(`Access list answered ${response.status} — the people list is off`);

        return null;
      }

      return toPeople((await response.json()) as AccessResponse);
    } catch (error) {
      this.logger.warn(`Access list is unreachable: ${error instanceof Error ? error.message : String(error)}`);

      return null;
    }
  }
}

/**
 * O corpo do outro serviço entra por aqui e sai no NOSSO formato. Nada é confiado: o que não for
 * texto vira vazio, e pessoa sem id ou sem nome e e-mail é descartada.
 */
export function toPeople(body: AccessResponse): DirectoryPerson[] {
  const people = Array.isArray(body.data?.people) ? body.data.people : [];

  return people
    .map((person) => ({
      id: textOf(person.id),
      name: textOf(person.name),
      email: textOf(person.email),
      avatarUrl: textOf(person.presentation?.avatarUrl) || null,
    }))
    .filter((person) => !!person.id && (!!person.name || !!person.email));
}

function textOf(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}
