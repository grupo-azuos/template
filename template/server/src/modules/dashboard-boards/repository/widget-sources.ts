import { TASK_STATUS_LABELS, type TaskStatus } from '@template/shared/domain/task-status.util';
import {
  type DataFieldType,
  type DataSourceKey,
} from '@template/shared/schemas/dashboard-board.schema';
import { historyActionLabel } from '@template/shared/schemas/history.schema';
import { sql, type SQL } from 'drizzle-orm';
import { type SQLiteTable } from 'drizzle-orm/sqlite-core';

import { history } from '../../../lib/db/schema/history.schema';
import { tasks } from '../../../lib/db/schema/tasks.schema';

/**
 * AS FONTES DE DADOS NO BANCO — a única ponte entre os nomes do contrato (`status`,
 * `createdDay`) e as colunas. O construtor de filtro só fala nomes daqui: um campo fora deste
 * mapa é recusado, e nenhum texto vindo da tela vira pedaço de SQL.
 *
 * É a metade do servidor de `shared/.../dashboard-sources.ts`: fonte nova entra nos dois, com as
 * MESMAS chaves (regra `dashboard-standard`). O resto do motor não muda.
 */
export type SourceColumn = {
  expression: SQL;
  type: DataFieldType;
  /** Campo de pessoa: o que a coluna guarda dela — o id, o e-mail ou o nome. */
  person?: 'id' | 'email' | 'name';
};

export type SourceTable = {
  table: SQLiteTable;
  /** O que conta como "existe": o arquivado não entra em dashboard nenhum. */
  inCirculation: SQL;
  fields: Record<string, SourceColumn>;
  /** A chave de cada grupo; nula é descartada nos agrupamentos no tempo. */
  dimensions: Record<string, SQL>;
  /** O dia (aaaa-mm-dd, Brasília) em que o registro aconteceu — o período do bloco recorta nele. */
  periodDay: SQL;
  /** A data de cada agrupamento por dia: é nela que a janela da agenda recorta, no banco. */
  dayDates?: Record<string, SQL>;
  /** O campo de pessoa do "só os meus", quando a fonte tem um. */
  personField?: string;
  /** As dimensões cuja chave é uma pessoa: o serviço troca pelo nome do diretório. */
  personDimensions?: readonly string[];
  /** O rótulo de uma chave, quando ela não é o próprio texto. */
  labelOf?: (dimension: string, key: string) => string;
};

/**
 * O DIA DE BRASÍLIA de uma data em milissegundos. O SQLite não tem fuso: Brasília é UTC−3 o ano
 * inteiro desde 2019, e um registro das 23h não pode cair no dia seguinte.
 */
export function brasiliaDay(column: SQL | SQLiteTable['_']['columns'][string]): SQL {
  return sql`date(${column} / 1000, 'unixepoch', '-3 hours')`;
}

function brasiliaMonth(column: SQL | SQLiteTable['_']['columns'][string]): SQL {
  return sql`strftime('%Y-%m', ${column} / 1000, 'unixepoch', '-3 hours')`;
}

const taskDay = brasiliaDay(tasks.createdAt);
const historyDay = brasiliaDay(history.occurredAt);

export const SOURCE_TABLES: Record<DataSourceKey, SourceTable> = {
  tasks: {
    table: tasks,
    inCirculation: sql`1 = 1`,
    fields: {
      status: { expression: sql`${tasks.status}`, type: 'enum' },
      createdBy: { expression: sql`${tasks.createdBy}`, type: 'text', person: 'email' },
      createdAt: { expression: taskDay, type: 'date' },
    },
    dimensions: {
      status: sql`${tasks.status}`,
      createdBy: sql`${tasks.createdBy}`,
      createdDay: taskDay,
      createdMonth: brasiliaMonth(tasks.createdAt),
    },
    periodDay: taskDay,
    dayDates: { createdDay: taskDay },
    personField: 'createdBy',
    personDimensions: ['createdBy'],
    labelOf: (dimension, key) =>
      dimension === 'status' ? (TASK_STATUS_LABELS[key as TaskStatus] ?? key) : key,
  },
  activity: {
    table: history,
    inCirculation: sql`${history.targetType} = 'task'`,
    fields: {
      action: { expression: sql`${history.action}`, type: 'enum' },
      actor: { expression: sql`${history.actorId}`, type: 'text', person: 'id' },
      occurredAt: { expression: historyDay, type: 'date' },
    },
    dimensions: {
      actor: sql`coalesce(${history.actorId}, '(sem autoria)')`,
      action: sql`${history.action}`,
      day: historyDay,
      month: brasiliaMonth(history.occurredAt),
    },
    periodDay: historyDay,
    dayDates: { day: historyDay },
    personField: 'actor',
    personDimensions: ['actor'],
    labelOf: (dimension, key) => (dimension === 'action' ? historyActionLabel(key) : key),
  },
};
