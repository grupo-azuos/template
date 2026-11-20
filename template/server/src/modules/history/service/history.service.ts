import { Injectable, Logger, type OnApplicationShutdown } from '@nestjs/common';
import { map, type Observable, Subject, throttleTime } from 'rxjs';
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

/** No máximo um sinal a cada 3 s: uma rajada de edições vira uma releitura só na tela. */
const CHANGE_THROTTLE_MS = 3000;

/**
 * A ESCRITA DO HISTÓRICO — o único caminho. Os services das outras entidades chamam `record`
 * no mesmo passo da escrita que ele descreve.
 *
 * Como TODA escrita passa por aqui, é daqui que sai o sinal "os números mudaram" que o
 * dashboard escuta para reler os blocos (`changes()`).
 */
@Injectable()
export class HistoryService implements OnApplicationShutdown {
  private readonly logger = new Logger(HistoryService.name);
  private readonly written = new Subject<void>();

  constructor(private readonly repository: HistoryRepository) {}

  /** O aviso de que algo mudou no sistema — o mesmo para todo mundo, no máximo a cada 3 s. */
  changes(): Observable<{ type: 'changed' }> {
    return this.written.pipe(
      throttleTime(CHANGE_THROTTLE_MS, undefined, { leading: true, trailing: true }),
      map(() => ({ type: 'changed' as const })),
    );
  }

  onApplicationShutdown(): void {
    this.written.complete();
  }

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
      this.written.next();
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
