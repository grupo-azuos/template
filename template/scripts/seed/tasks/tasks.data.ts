import { type TaskInsert } from '../../../server/src/lib/db/schema/tasks.schema';

/**
 * Os dados de teste de tarefas. VERSIONADOS: toda máquina que rodar o seed vê exatamente isto.
 *
 * O `id` é fixo de propósito — é a chave que torna o seed idempotente: rodar de novo atualiza
 * estas linhas em vez de criar cópias.
 *
 * Dado INVENTADO, sempre. Nome de cliente real, CPF, e-mail de pessoa de verdade: nada disso
 * entra aqui, porque este arquivo vai para o git e fica no histórico para sempre.
 */

/**
 * As pessoas FICTÍCIAS dos dados de exemplo — quem cadastrou as tarefas e quem mexeu nelas. São
 * elas que o dashboard de exemplo mostra em "Quem cadastrou" e no movimento da equipe.
 */
export const SEED_PEOPLE = {
  ana: { id: 'seed-ana', email: 'ana@template.local', name: 'Ana Exemplo' },
  bia: { id: 'seed-bia', email: 'bia@template.local', name: 'Bia Exemplo' },
  caio: { id: 'seed-caio', email: 'caio@template.local', name: 'Caio Exemplo' },
} as const;

const MONTH_MS = 30 * 24 * 60 * 60 * 1000;

/** Datas espalhadas pelos últimos meses: o bloco "por mês" do dashboard nasce com curva. */
function monthsAgo(months: number): Date {
  return new Date(Date.now() - months * MONTH_MS);
}

export const TASKS_SEED: TaskInsert[] = [
  {
    id: 1,
    title: 'Conhecer o template',
    description: 'Abrir o README e rodar `npm run dev` pela primeira vez.',
    status: 'done',
    createdBy: SEED_PEOPLE.ana.email,
    createdAt: monthsAgo(3),
  },
  {
    id: 2,
    title: 'Descrever a primeira funcionalidade do MVP',
    description: 'Escrever em uma frase o que a pessoa que usa o sistema precisa conseguir fazer.',
    status: 'doing',
    createdBy: SEED_PEOPLE.bia.email,
    createdAt: monthsAgo(2),
  },
  {
    id: 3,
    title: 'Pedir ao Claude a primeira tela',
    description: 'Usar a skill nova-feature com a frase escrita na tarefa anterior.',
    status: 'todo',
    createdBy: SEED_PEOPLE.caio.email,
    createdAt: monthsAgo(1),
  },
  {
    id: 4,
    title: 'Mostrar o MVP para alguém',
    description: null,
    status: 'todo',
    createdBy: SEED_PEOPLE.ana.email,
    createdAt: monthsAgo(0),
  },
  {
    id: 5,
    title: 'Tarefa com um título bem comprido para conferir se a lista quebra a linha direito sem empurrar os botões para fora da tela',
    description: 'Caso limite: existe para aparecer na tela, não para ser feita.',
    status: 'todo',
    createdBy: SEED_PEOPLE.bia.email,
    createdAt: monthsAgo(0),
  },
];
