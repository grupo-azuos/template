import { TASK_STATUSES } from '../domain/task-status.util';
import { historyActionSchema } from './history.schema';
import { type BoardFieldFilter, type DataSource } from './dashboard-source.types';

/**
 * AS FONTES DE DADOS DO DASHBOARD DESTE SISTEMA — o ÚNICO arquivo do contrato do dashboard que
 * cada projeto troca (regra `dashboard-standard`). Fonte nova = uma entrada aqui, uma em
 * `server/.../widget-sources.ts` (as colunas no banco) e pronto: a tela, o editor de bloco, o
 * construtor de filtro e os filtros do painel passam a oferecê-la sozinhos.
 *
 * As do template são de EXEMPLO: as tarefas e o movimento delas (do histórico padrão).
 */
export const DATA_SOURCES = {
  tasks: {
    label: 'Tarefas',
    noun: 'tarefas',
    fields: {
      status: { label: 'Status', type: 'enum', options: TASK_STATUSES },
      createdBy: { label: 'Quem cadastrou', type: 'text', isPerson: true },
      createdAt: { label: 'Cadastrada em', type: 'date' },
    },
    dimensions: {
      status: { label: 'Status', kind: 'category' },
      createdBy: { label: 'Quem cadastrou', kind: 'category' },
      createdDay: { label: 'Cadastradas (por dia)', kind: 'day' },
      createdMonth: { label: 'Cadastradas (por mês)', kind: 'month' },
    },
  },
  /** O MOVIMENTO DA EQUIPE — o que cada um fez nas tarefas, do histórico padrão. */
  activity: {
    label: 'Movimento nas tarefas',
    noun: 'movimentos',
    fields: {
      action: { label: 'O que foi feito', type: 'enum', options: historyActionSchema.options },
      actor: { label: 'Quem fez', type: 'text', isPerson: true },
      occurredAt: { label: 'Quando', type: 'date' },
    },
    dimensions: {
      actor: { label: 'Quem fez', kind: 'category' },
      action: { label: 'O que foi feito', kind: 'category' },
      day: { label: 'Por dia', kind: 'day' },
      month: { label: 'Por mês', kind: 'month' },
    },
  },
} as const satisfies Record<string, DataSource>;

/**
 * OS FILTROS DE CAMPO DO PAINEL deste sistema — além de "Pessoa" e "Período", que todo painel
 * tem. Cada um diz qual campo é em cada fonte.
 */
export const BOARD_FIELD_FILTERS = {
  taskStatus: { label: 'Status da tarefa', fields: { tasks: 'status' } },
} as const satisfies Record<string, BoardFieldFilter>;
