import { Inject, Injectable } from '@nestjs/common';
import { type ArchivedFilter } from '@template/shared/schemas/archive.schema';
import {
  type DashboardScope,
  type FilterGroup,
  type SaveBoardInput,
  type SaveFilterInput,
} from '@template/shared/schemas/dashboard-board.schema';
import { and, asc, eq, or, sql, type SQL } from 'drizzle-orm';

import { archivedCondition, archiveValues } from '../../../lib/db/archive.util';
import { runMaybe, runQuery } from '../../../lib/db/db-error.util';
import { DB } from '../../../lib/db/db.token';
import { type Database } from '../../../lib/db/db.type';
import {
  dashboardBoards,
  type DashboardBoardRow,
  savedFilters,
  type SavedFilterRow,
} from '../../../lib/db/schema/dashboard-boards.schema';
import { filterToSql } from './filter-sql.util';
import { type SourceTable } from './widget-sources';

/** Quantos grupos um bloco recebe no máximo: mais que isso não se lê num gráfico. */
export const MAX_GROUPS = 200;

/** Quantas células um cruzamento recebe no máximo: um mapa de calor maior não se lê. */
export const MAX_CELLS = 600;

/** O painel de todos (Equipe, Gestor) não tem dono: `''` — ver `dashboard-boards.schema.ts`. */
const NO_OWNER = '';

@Injectable()
export class DashboardBoardsRepository {
  constructor(@Inject(DB) private readonly db: Database) {}

  findBoard(scope: DashboardScope, ownerId: string | null): Promise<DashboardBoardRow | null> {
    return runMaybe(
      this.db
        .select()
        .from(dashboardBoards)
        .where(and(eq(dashboardBoards.scope, scope), eq(dashboardBoards.ownerId, ownerId ?? NO_OWNER)))
        .limit(1),
      'ler o dashboard',
    );
  }

  /** Grava o painel do contexto — o primeiro salvamento cria, os seguintes trocam. */
  async saveBoard(
    scope: DashboardScope,
    ownerId: string | null,
    board: SaveBoardInput,
    actorId: string,
  ): Promise<DashboardBoardRow> {
    const values = {
      widgets: board.widgets,
      layout: board.layout,
      filters: board.filters,
      updatedAt: new Date(),
      updatedBy: actorId,
    };
    const [row] = await runQuery(
      this.db
        .insert(dashboardBoards)
        .values({ scope, ownerId: ownerId ?? NO_OWNER, ...values })
        .onConflictDoUpdate({ target: [dashboardBoards.scope, dashboardBoards.ownerId], set: values })
        .returning(),
      'salvar o dashboard',
    );
    if (!row) throw new Error('Dashboard upsert returned no row');

    return row;
  }

  /** Os filtros que a pessoa vê: os dela e os compartilhados. */
  listFilters(viewerId: string, archived: ArchivedFilter): Promise<SavedFilterRow[]> {
    return runQuery(
      this.db
        .select()
        .from(savedFilters)
        .where(
          and(
            or(eq(savedFilters.ownerId, viewerId), eq(savedFilters.scope, 'shared')),
            archivedCondition(savedFilters.archivedAt, archived),
          ),
        )
        .orderBy(asc(savedFilters.name)),
      'listar os filtros',
    );
  }

  findFilter(id: string): Promise<SavedFilterRow | null> {
    return runMaybe(
      this.db.select().from(savedFilters).where(eq(savedFilters.id, id)).limit(1),
      'ler o filtro',
    );
  }

  async insertFilter(input: SaveFilterInput, ownerId: string): Promise<SavedFilterRow> {
    const [row] = await runQuery(
      this.db
        .insert(savedFilters)
        .values({
          name: input.name,
          description: input.description ?? null,
          source: input.source,
          scope: input.scope,
          tree: input.tree,
          ownerId,
        })
        .returning(),
      'salvar o filtro',
    );
    if (!row) throw new Error('Filter insert returned no row');

    return row;
  }

  updateFilter(id: string, input: SaveFilterInput): Promise<SavedFilterRow | null> {
    return runMaybe(
      this.db
        .update(savedFilters)
        .set({
          name: input.name,
          description: input.description ?? null,
          source: input.source,
          scope: input.scope,
          tree: input.tree,
          updatedAt: new Date(),
        })
        .where(eq(savedFilters.id, id))
        .returning(),
      'salvar o filtro',
    );
  }

  setFilterArchived(id: string, archived: boolean, actorId: string): Promise<SavedFilterRow | null> {
    return runMaybe(
      this.db
        .update(savedFilters)
        .set(archiveValues(archived, actorId))
        .where(eq(savedFilters.id, id))
        .returning(),
      archived ? 'arquivar o filtro' : 'desarquivar o filtro',
    );
  }

  /**
   * Os números de um bloco: quantos há no recorte (filtro, "só os meus", período), quantos há
   * na fonte inteira, e — se agrupa — quantos por grupo. Categoria vem do maior para o menor;
   * tempo, em ordem de data, sem os sem data. Com `split`, também o cruzamento das duas.
   */
  async countBy(
    source: SourceTable,
    query: {
      tree: FilterGroup | null;
      extra: SQL | undefined;
      dimension: CountDimension | null;
      split: CountDimension | null;
    },
  ): Promise<CountedWidget> {
    const where = and(
      source.inCirculation,
      query.tree ? filterToSql(source, query.tree) : undefined,
      query.extra,
    );
    const [counted] = await runQuery(
      this.db
        .select({
          total: sql<number>`coalesce(sum(case when ${where ?? sql`1 = 1`} then 1 else 0 end), 0)`,
          grandTotal: sql<number>`count(*)`,
        })
        .from(source.table)
        .where(source.inCirculation),
      'contar o bloco',
    );
    const totals = { total: Number(counted?.total ?? 0), grandTotal: Number(counted?.grandTotal ?? 0) };
    if (!query.dimension) return { ...totals, groups: [], cells: [] };

    const [groups, cells] = await Promise.all([
      this.groupRows(source, where, query.dimension),
      query.split ? this.cellRows(source, where, query.dimension, query.split) : [],
    ]);

    return { ...totals, groups, cells };
  }

  private async groupRows(
    source: SourceTable,
    where: SQL | undefined,
    dimension: CountDimension,
  ): Promise<{ key: string; value: number }[]> {
    const rows = await runQuery(
      this.db
        .select({ key: sql<string>`${dimension.expression}`, value: sql<number>`count(*)` })
        .from(source.table)
        .where(dimension.isTime ? and(where, sql`${dimension.expression} is not null`) : where)
        .groupBy(sql`1`)
        .orderBy(dimension.isTime ? sql`1 asc` : sql`2 desc, 1 asc`)
        .limit(MAX_GROUPS),
      'agrupar o bloco',
    );

    return rows.map((row) => ({ key: String(row.key), value: Number(row.value) }));
  }

  private async cellRows(
    source: SourceTable,
    where: SQL | undefined,
    dimension: CountDimension,
    split: CountDimension,
  ): Promise<{ key: string; key2: string; value: number }[]> {
    const rows = await runQuery(
      this.db
        .select({
          key: sql<string>`${dimension.expression}`,
          key2: sql<string>`${split.expression}`,
          value: sql<number>`count(*)`,
        })
        .from(source.table)
        .where(where)
        .groupBy(sql`1, 2`)
        .orderBy(sql`3 desc`)
        .limit(MAX_CELLS),
      'cruzar o bloco',
    );

    return rows.map((row) => ({
      key: String(row.key),
      key2: String(row.key2),
      value: Number(row.value),
    }));
  }
}

export type CountDimension = { key: string; expression: SQL; isTime: boolean };

export type CountedWidget = {
  total: number;
  grandTotal: number;
  groups: { key: string; value: number }[];
  cells: { key: string; key2: string; value: number }[];
};
