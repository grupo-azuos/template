import { sql } from 'drizzle-orm';

import { type Database } from '../../../server/src/lib/db/db.type';
import { history } from '../../../server/src/lib/db/schema/history.schema';
import { openSeedDatabase, report } from '../seed.util';
import { HISTORY_SEED } from './history.data';

/**
 * Grava o movimento de exemplo no histórico. Idempotente pelo `id`, como as tarefas: rodar de
 * novo reescreve as mesmas linhas — e as datas voltam a ficar dentro da última semana.
 */
export async function seedHistory(db: Database): Promise<number> {
  await db
    .insert(history)
    .values(HISTORY_SEED)
    .onConflictDoUpdate({
      target: history.id,
      set: {
        action: sql`excluded.action`,
        targetId: sql`excluded.target_id`,
        targetLabel: sql`excluded.target_label`,
        changes: sql`excluded.changes`,
        actorId: sql`excluded.actor_id`,
        actorEmail: sql`excluded.actor_email`,
        actorName: sql`excluded.actor_name`,
        occurredAt: sql`excluded.occurred_at`,
      },
    });

  return HISTORY_SEED.length;
}

/* Rodando sozinho (`npm run seed:history`), abre o banco e grava só esta entidade. */
if (require.main === module) {
  const { db, close } = openSeedDatabase();

  seedHistory(db)
    .then((count) => report('histórico', count))
    .finally(close);
}
