import { Injectable, type OnApplicationShutdown } from '@nestjs/common';
import { filter, map, type Observable, Subject } from 'rxjs';

/**
 * QUEM AVISA A TELA, NA HORA — repassa "chegou notificação" para quem está com o sistema aberto.
 *
 * Um processo só: o SQLite tem um escritor por vez, e a imagem roda uma réplica. Por isso o
 * aviso é um `Subject` em memória, e não um canal do banco. Sistema que passar para Postgres
 * com várias réplicas troca este serviço por `LISTEN/NOTIFY` (o Paralegal é a referência).
 *
 * O aviso leva só o id da pessoa — a tela busca o que mudou pela rota de sempre, com as regras
 * de sempre. Tela que perdeu o aviso não perde a notificação: a próxima leitura vem do banco.
 */
@Injectable()
export class NotificationStreamService implements OnApplicationShutdown {
  private readonly arrivals = new Subject<string>();

  onApplicationShutdown(): void {
    this.arrivals.complete();
  }

  /** O fluxo de uma pessoa: um sinal a cada notificação nova dela. */
  streamFor(recipientId: string): Observable<{ type: 'notification' }> {
    return this.arrivals.pipe(
      filter((id) => id === recipientId),
      map(() => ({ type: 'notification' as const })),
    );
  }

  announce(recipientId: string): void {
    this.arrivals.next(recipientId);
  }
}
