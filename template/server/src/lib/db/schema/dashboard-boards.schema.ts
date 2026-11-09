import { uuidV7 } from '@template/shared/domain/uuid.util';
import {
  type BoardFilter,
  type FilterGroup,
  type LayoutItem,
  type Widget,
} from '@template/shared/schemas/dashboard-board.schema';
import { sql } from 'drizzle-orm';
import { index, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

import { archiveColumns } from '../archive.util';

const now = sql`(cast(unixepoch('subsec') * 1000 as integer))`;

/**
 * OS DASHBOARDS MONTADOS — um por contexto: `team` e `manager` têm um só, e `personal` tem um
 * por pessoa. O conteúdo (blocos, lugares, filtros do painel) é JSON validado pelo contrato
 * antes de gravar; o banco garante só que não há dois painéis no mesmo contexto.
 *
 * `owner_id` é `''` nos painéis de todos: no SQLite dois nulos não colidem num índice único, e
 * o "um painel da equipe" deixaria de ser garantido pelo banco.
 */
export const dashboardBoards = sqliteTable(
  'dashboard_boards',
  {
    id: text('id').primaryKey().$defaultFn(uuidV7),
    scope: text('scope', { enum: ['team', 'manager', 'personal'] }).notNull(),
    ownerId: text('owner_id').notNull().default(''),
    widgets: text('widgets', { mode: 'json' }).$type<Widget[]>().notNull(),
    layout: text('layout', { mode: 'json' }).$type<LayoutItem[]>().notNull(),
    filters: text('filters', { mode: 'json' }).$type<BoardFilter[]>().notNull().default([]),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull().default(now),
    updatedBy: text('updated_by'),
  },
  (table) => [uniqueIndex('dashboard_boards_scope_owner').on(table.scope, table.ownerId)],
);

export type DashboardBoardRow = typeof dashboardBoards.$inferSelect;

/**
 * OS FILTROS SALVOS — do sistema, não de um dashboard: montados uma vez, servem a qualquer
 * bloco. `personal` só quem criou vê; `shared` a equipe vê, e só quem criou (ou o gestor) muda.
 * Não se apagam: arquivam.
 */
export const savedFilters = sqliteTable(
  'saved_filters',
  {
    id: text('id').primaryKey().$defaultFn(uuidV7),
    name: text('name').notNull(),
    description: text('description'),
    source: text('source').notNull(),
    scope: text('scope', { enum: ['personal', 'shared'] }).notNull(),
    tree: text('tree', { mode: 'json' }).$type<FilterGroup>().notNull(),
    ownerId: text('owner_id').notNull(),
    createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull().default(now),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull().default(now),
    ...archiveColumns(),
  },
  (table) => [index('saved_filters_owner_idx').on(table.ownerId)],
);

export type SavedFilterRow = typeof savedFilters.$inferSelect;
