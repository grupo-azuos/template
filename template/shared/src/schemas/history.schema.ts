import { z } from 'zod';

import { paginatedSchema, paginationQuerySchema } from './pagination.schema';

/**
 * HISTÓRICO — quem mudou o quê e quando, no sistema inteiro. Só cresce, nunca é reescrito: é o
 * que responde "quem mudou isso?" quando a equipe diz que um campo voltou atrás.
 *
 * TODO SISTEMA DO GRUPO TEM ESTE HISTÓRICO, IGUAL A ESTE (regra `history-standard`). A forma —
 * tabela, API, tela — não muda de projeto para projeto. O que cada um acrescenta é só o
 * vocabulário: as ações e os tipos de alvo DELE, nas duas listas abaixo, e o rótulo de cada uma.
 */
export const historyActionSchema = z.enum(['task.created', 'task.updated', 'task.deleted']);

export type HistoryAction = z.infer<typeof historyActionSchema>;

export const historyTargetTypeSchema = z.enum(['task']);

export type HistoryTargetType = z.infer<typeof historyTargetTypeSchema>;

/**
 * `changes` guarda campo, valor anterior e valor novo. É o que permite responder "voltou atrás
 * por quê" sem guardar o registro inteiro em cada linha.
 */
export const historyChangeSchema = z.object({
  field: z.string(),
  from: z.string().nullable(),
  to: z.string().nullable(),
});

export type HistoryChange = z.infer<typeof historyChangeSchema>;

/** O que cada ação quer dizer, em português — a tela nunca mostra `task.updated`. */
export const HISTORY_ACTION_LABELS: Record<HistoryAction, string> = {
  'task.created': 'Cadastrou a tarefa',
  'task.updated': 'Alterou a tarefa',
  'task.deleted': 'Excluiu a tarefa',
};

export const HISTORY_TARGET_LABELS: Record<HistoryTargetType, string> = {
  task: 'Tarefa',
};

/**
 * UMA LINHA DO HISTÓRICO, como a tela a mostra. A ação pode ser uma que esta versão não conhece
 * (linha escrita por uma versão mais nova): por isso é texto, e o rótulo cai no texto cru.
 */
export const historyEntrySchema = z.object({
  id: z.string(),
  action: z.string(),
  target: z.object({ type: z.string(), id: z.string(), label: z.string().nullable() }),
  changes: z.array(historyChangeSchema),
  actor: z.object({ id: z.string().nullable(), name: z.string().nullable() }),
  occurredAt: z.iso.datetime({ offset: true }),
});

export type HistoryEntry = z.infer<typeof historyEntrySchema>;

const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;

/**
 * O que a tela filtra: o tipo do alvo, a ação, quem fez (`me` é quem está vendo), o período em
 * dias de Brasília e um texto no nome do alvo. Paginada: o histórico só cresce.
 */
export const historyQuerySchema = paginationQuerySchema.extend({
  targetType: historyTargetTypeSchema.optional(),
  action: historyActionSchema.optional(),
  actor: z.literal('me').optional(),
  from: z.string().regex(ISO_DAY).optional(),
  to: z.string().regex(ISO_DAY).optional(),
  search: z.string().trim().max(120).optional(),
});

export type HistoryQuery = z.infer<typeof historyQuerySchema>;

export const historyPageSchema = paginatedSchema(historyEntrySchema);

/** O rótulo de uma ação, ou o texto cru quando ela é de uma versão mais nova. */
export function historyActionLabel(action: string): string {
  return HISTORY_ACTION_LABELS[action as HistoryAction] ?? action;
}
