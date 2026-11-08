import { randomUUID } from 'node:crypto';

import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { type Paginated } from '@template/shared/schemas/pagination.schema';
import {
  type Notification,
  type NotificationInbox,
  type NotificationQuery,
  type NotificationSetting,
  type NotificationTopic,
  type UpdateNotificationSettingsInput,
} from '@template/shared/schemas/notification.schema';

import { type RequestUser } from '../../../lib/auth/request-user.type';
import { type Env } from '../../../lib/config/env.schema';
import { ENV } from '../../../lib/config/env.token';
import { packageVersion } from '../../../lib/http/api-version';
import { assertCanManageNotifications } from '../../../lib/policy/policy-assert.util';
import { toNotification, toSettings } from '../mapper/notifications.mapper';
import { NotificationsRepository } from '../repository/notifications.repository';
import { NotificationStreamService } from './notification-stream.service';

/** O que quem gera uma notificação informa. Nível e "se notifica" são do administrador. */
export type NotifyInput = {
  topic: NotificationTopic;
  /** Para quem: os ids da identidade (auth-forward) — nunca e-mail nem nome. */
  recipients: readonly string[];
  /** Quem causou o fato não é avisado do que acabou de fazer. */
  exceptId?: string;
  title: string;
  body: string;
  action?: { label: string; to: string } | null;
  /** O FATO, sem a pessoa: o mesmo fato para a mesma pessoa vira uma notificação só. */
  dedupeKey: string;
};

/** Quanto tempo a escolha do administrador fica lembrada — mudar vale em até isso. */
const SETTINGS_TTL_MS = 30_000;

/**
 * As notificações: quem gera chama `notify` (no service da feature, depois de gravar), e a tela
 * lê pelo sininho, pelo diálogo de entrada, pelo tempo real e pelo histórico.
 */
@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private cachedSettings: { value: NotificationSetting[]; at: number } | null = null;

  constructor(
    private readonly repository: NotificationsRepository,
    private readonly stream: NotificationStreamService,
    @Inject(ENV) private readonly env: Pick<Env, 'NODE_ENV'>,
  ) {}

  /**
   * Gera a notificação — se o administrador deixou o assunto ligado, com o nível escolhido.
   *
   * NÃO lança: quem notifica está no meio de outra coisa (gravar uma tarefa), e a notificação
   * não pode derrubar o trabalho que a originou. A falha vai para o log.
   */
  async notify(input: NotifyInput): Promise<number> {
    try {
      const setting = (await this.settingsCached()).find((item) => item.topic === input.topic);
      if (!setting?.isEnabled) return 0;
      const recipients = [...new Set(input.recipients)].filter((id) => id !== input.exceptId);
      const inserted = await this.repository.insertMany(
        recipients.map((recipientId) => ({
          id: randomUUID(),
          recipientId,
          topic: input.topic,
          severity: setting.severity,
          title: input.title,
          body: input.body,
          actionLabel: input.action?.label ?? null,
          actionTo: input.action?.to ?? null,
          dedupeKey: input.dedupeKey,
        })),
      );
      for (const row of inserted) this.stream.announce(row.recipientId);

      return inserted.length;
    } catch (error) {
      this.logger.error(
        `Notification ${input.topic} (${input.dedupeKey}) failed: ${error instanceof Error ? error.message : String(error)}`,
      );

      return 0;
    }
  }

  /**
   * O sininho e o diálogo de entrada. A versão nova chega aqui: sem cadastro de pessoas no
   * template, quem fica sabendo da atualização é quem abre o sistema depois dela — uma vez por
   * versão, pela trava do fato.
   */
  async inbox(user: RequestUser): Promise<NotificationInbox> {
    await this.announceRelease(user);
    const { rows, unread } = await this.repository.inbox(user.id);

    return { items: rows.map(toNotification), unread };
  }

  async page(user: RequestUser, query: NotificationQuery): Promise<Paginated<Notification>> {
    const { rows, total } = await this.repository.page(user.id, query);

    return {
      items: rows.map(toNotification),
      total,
      page: query.page,
      pageSize: query.pageSize,
    };
  }

  /** Cada pessoa lê só as suas: a de outra pessoa responde como inexistente. */
  async markRead(user: RequestUser, id: string): Promise<Notification> {
    const row = await this.repository.markRead(user.id, id, new Date());
    if (!row) throw new NotFoundException('Notificação não encontrada.');

    return toNotification(row);
  }

  markManyRead(user: RequestUser, ids: readonly string[]): Promise<number> {
    return this.repository.markManyRead(user.id, ids, new Date());
  }

  markAllRead(user: RequestUser): Promise<number> {
    return this.repository.markAllRead(user.id, new Date());
  }

  async settings(user: RequestUser): Promise<NotificationSetting[]> {
    assertCanManageNotifications(user.role);

    return toSettings(await this.repository.settings());
  }

  async saveSettings(
    user: RequestUser,
    input: UpdateNotificationSettingsInput,
  ): Promise<NotificationSetting[]> {
    assertCanManageNotifications(user.role);

    await this.repository.saveSettings(input.settings, user.id, new Date());
    this.cachedSettings = null;

    return toSettings(await this.repository.settings());
  }

  private async announceRelease(user: RequestUser): Promise<void> {
    if (this.env.NODE_ENV === 'test') return;
    const version = packageVersion();

    await this.notify({
      topic: 'system.release',
      recipients: [user.id],
      title: `Versão ${version} no ar`,
      body: 'O sistema foi atualizado. Se algo parecer diferente, é novidade — não erro.',
      action: null,
      dedupeKey: `release:${version}`,
    });
  }

  private async settingsCached(): Promise<NotificationSetting[]> {
    if (this.cachedSettings && Date.now() - this.cachedSettings.at < SETTINGS_TTL_MS) {
      return this.cachedSettings.value;
    }
    const value = toSettings(await this.repository.settings());
    this.cachedSettings = { value, at: Date.now() };

    return value;
  }
}
