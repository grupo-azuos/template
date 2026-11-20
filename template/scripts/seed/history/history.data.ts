import { type HistoryInsert } from '../../../server/src/lib/db/schema/history.schema';
import { SEED_PEOPLE } from '../tasks/tasks.data';

/**
 * O MOVIMENTO DE EXEMPLO — linhas do histórico sobre as tarefas de teste, para o painel do
 * dashboard ("Movimento da semana", "Meu movimento") e a tela Histórico nascerem com conteúdo.
 *
 * As datas são relativas a HOJE: o seed rodado em qualquer dia cai dentro de "últimos 7 dias".
 * Dado INVENTADO, sempre — pessoas fictícias, sem e-mail de verdade.
 */
const DAY_MS = 24 * 60 * 60 * 1000;

function daysAgo(days: number, hour = 10): Date {
  const date = new Date(Date.now() - days * DAY_MS);
  date.setUTCHours(hour + 3, 0, 0, 0);

  return date;
}

type Move = {
  id: number;
  who: keyof typeof SEED_PEOPLE;
  action: 'task.created' | 'task.updated';
  task: number;
  label: string;
  days: number;
};

const MOVES: Move[] = [
  { id: 1, who: 'ana', action: 'task.created', task: 1, label: 'Conhecer o template', days: 6 },
  { id: 2, who: 'ana', action: 'task.updated', task: 1, label: 'Conhecer o template', days: 5 },
  { id: 3, who: 'bia', action: 'task.created', task: 2, label: 'Descrever a primeira funcionalidade do MVP', days: 5 },
  { id: 4, who: 'bia', action: 'task.updated', task: 2, label: 'Descrever a primeira funcionalidade do MVP', days: 3 },
  { id: 5, who: 'caio', action: 'task.created', task: 3, label: 'Pedir ao Claude a primeira tela', days: 4 },
  { id: 6, who: 'ana', action: 'task.updated', task: 3, label: 'Pedir ao Claude a primeira tela', days: 2 },
  { id: 7, who: 'caio', action: 'task.created', task: 4, label: 'Mostrar o MVP para alguém', days: 1 },
  { id: 8, who: 'bia', action: 'task.updated', task: 4, label: 'Mostrar o MVP para alguém', days: 0 },
];

export const HISTORY_SEED: HistoryInsert[] = MOVES.map((move) => ({
  id: move.id,
  action: move.action,
  targetType: 'task',
  targetId: String(move.task),
  targetLabel: move.label,
  changes: move.action === 'task.updated' ? [{ field: 'Status', from: 'todo', to: 'doing' }] : [],
  actorId: SEED_PEOPLE[move.who].id,
  actorEmail: SEED_PEOPLE[move.who].email,
  actorName: SEED_PEOPLE[move.who].name,
  occurredAt: daysAgo(move.days),
}));
