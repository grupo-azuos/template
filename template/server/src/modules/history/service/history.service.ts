import { Injectable, Logger } from '@nestjs/common';
import {
  type HistoryAction,
  type HistoryChange,
  type HistoryTargetType,
} from '@template/shared/schemas/history.schema';

import { type RequestUser } from '../../../lib/auth/request-user.type';
import { HistoryRepository } from '../repository/history.repository';

export type RecordHistoryInput = {
  actor: RequestUser;
  action: HistoryAction;
  targetType: HistoryTargetType;
  targetId: string | number;
  targetLabel?: string | null;
  changes?: HistoryChange[];
};

/**
 * A ESCRITA DO HISTÓRICO — o único caminho. Os services das outras entidades chamam `record`
 * no mesmo passo da escrita que ele descreve.
 */
@Injectable()
export class HistoryService {
  private readonly logger = new Logger(HistoryService.name);

  constructor(private readonly repository: HistoryRepository) {}

  /**
   * FALHAR AQUI NÃO DESFAZ A ESCRITA PRINCIPAL. O histórico é diagnóstico; recusar o
   * salvamento porque a linha de auditoria não entrou seria transformar um problema nosso em
   * "não consigo trabalhar" para a equipe. A falha vai para o log do servidor.
   *
   * Autoria e hora não são do corpo de quem chama: `actor` é a identidade da requisição, e a
   * hora é o relógio do banco.
   */
  async record(input: RecordHistoryInput): Promise<void> {
    try {
      await this.repository.insert({
        action: input.action,
        targetType: input.targetType,
        targetId: String(input.targetId),
        targetLabel: input.targetLabel ?? null,
        changes: input.changes ?? [],
        actorId: input.actor.id,
        actorEmail: input.actor.email,
        actorName: input.actor.name,
      });
    } catch (error) {
      this.logger.error(
        `History not recorded for ${input.action} on ${input.targetType}:${input.targetId}`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }

  /**
   * Registra apenas se houve mudança. Uma linha dizendo que nada mudou é ruído que empurra
   * para baixo a linha que importa.
   */
  async recordIfChanged(input: RecordHistoryInput): Promise<void> {
    if (!input.changes?.length) return;

    await this.record(input);
  }
}
