import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { todayIso } from '@template/shared/domain/calendar-date.util';
import { type ArchivedFilter } from '@template/shared/schemas/archive.schema';
import {
  type Board,
  type BoardMatch,
  boardMatchGroup,
  boardWeight,
  type DashboardScope,
  type DataSourceKey,
  dimensionsOf,
  type FilterGroup,
  hasPersonField,
  MAX_BOARD_WEIGHT,
  ME_VALUE,
  periodRange,
  type SaveBoardInput,
  type SavedFilter,
  type SaveFilterInput,
  type WidgetData,
  type WidgetQuery,
  windowRange,
} from '@template/shared/schemas/dashboard-board.schema';
import { and, sql, type SQL } from 'drizzle-orm';

import { type RequestUser } from '../../../lib/auth/request-user.type';
import { type SavedFilterRow } from '../../../lib/db/schema/dashboard-boards.schema';
import { canEdit as isManagerRole } from '../../../lib/policy/access.policy';
import { UserDirectoryService } from '../../users/service/user-directory.service';
import { toBoard, toSavedFilter } from '../mapper/dashboard-boards.mapper';
import {
  type CountDimension,
  type CountedWidget,
  DashboardBoardsRepository,
} from '../repository/dashboard-boards.repository';
import { InvalidFilterError } from '../repository/filter-sql.util';
import { bindViewer, type PersonFields, type PersonKeys } from '../repository/viewer-filter.util';
import { SOURCE_TABLES, type SourceTable } from '../repository/widget-sources';
import { defaultBoard } from './default-boards';

/**
 * OS DASHBOARDS MONTADOS — quem vê, quem edita, e os números de cada bloco. É o MOTOR, igual em
 * todo sistema do grupo (regra `dashboard-standard`); o que muda de projeto para projeto são só
 * as fontes (`dashboard-sources.ts` e `widget-sources.ts`) e o painel padrão (`default-boards.ts`).
 *
 * - Equipe: todos veem; gestor para cima edita.
 * - Gestor: só gestor para cima, para ver e para editar.
 * - Pessoal: só a pessoa — cada um tem o seu.
 *
 * Filtro salvo: o pessoal só quem criou vê e usa; o compartilhado a equipe vê, e só quem criou
 * (ou o gestor) muda. Nenhum se apaga — arquiva.
 */
@Injectable()
export class DashboardBoardsService {
  constructor(
    private readonly repository: DashboardBoardsRepository,
    private readonly people: UserDirectoryService,
  ) {}

  async board(user: RequestUser, scope: DashboardScope): Promise<Board> {
    assertCanView(user, scope);
    const row = await this.repository.findBoard(scope, ownerOf(user, scope));

    return toBoard(scope, row ?? defaultBoard(scope), row, canEdit(user, scope));
  }

  async saveBoard(user: RequestUser, scope: DashboardScope, input: SaveBoardInput): Promise<Board> {
    if (!canEdit(user, scope)) {
      throw new ForbiddenException('Este dashboard é editado pelo gestor para cima.');
    }
    await this.assertWithinWeight(scope, ownerOf(user, scope), input);
    for (const widget of input.widgets) {
      if (widget.filterId) await this.usableFilter(user, widget.filterId, widget.source);
    }
    const row = await this.repository.saveBoard(scope, ownerOf(user, scope), input, user.id);

    return toBoard(scope, row, row, true);
  }

  /**
   * A COTA DE PONTOS do painel, conferida aqui e não só na tela — pela API, ninguém passa dela.
   *
   * O painel montado antes da cota pode estar acima dela, e ele continua salvando (mudar um
   * bloco de lugar não pode virar erro): o que se recusa é PASSAR da cota, ou subir ainda mais
   * quem já passou.
   */
  private async assertWithinWeight(
    scope: DashboardScope,
    owner: string | null,
    input: SaveBoardInput,
  ): Promise<void> {
    const weight = boardWeight(input.widgets);
    if (weight <= MAX_BOARD_WEIGHT) return;

    const saved = await this.repository.findBoard(scope, owner);
    const before = boardWeight(saved?.widgets ?? defaultBoard(scope).widgets);
    if (weight <= before) return;

    throw new UnprocessableEntityException(
      `O painel passa da cota de ${MAX_BOARD_WEIGHT} pontos (${weight}). Tire ou troque um bloco.`,
    );
  }

  async data(user: RequestUser, query: WidgetQuery): Promise<WidgetData> {
    const directory = await this.directory(user);
    const viewer = keysOf(user);
    const saved = query.filterId
      ? (await this.usableFilter(user, query.filterId, query.source)).tree
      : null;
    const source = SOURCE_TABLES[query.source];
    const bound = saved ? bindViewer(saved, personFieldsOf(source), viewer, directory) : null;
    /* Os filtros de campo do painel entram como mais um grupo E na mesma árvore: a pergunta do
       bloco continua uma consulta só, e o campo passa pela mesma validação do filtro salvo. */
    const tree = withMatches(bound, query.matches);
    const person = personOf(query, viewer, directory);

    try {
      const counted = await this.repository.countBy(source, {
        tree,
        extra: scopeCondition(source, query, viewer, person),
        dimension: query.groupBy ? dimensionOf(query.source, query.groupBy) : null,
        split: query.splitBy ? dimensionOf(query.source, query.splitBy) : null,
      });

      return toWidgetData(counted, query, labeler(source, directory));
    } catch (error) {
      if (error instanceof InvalidFilterError) throw new UnprocessableEntityException(error.message);
      throw error;
    }
  }

  async filters(user: RequestUser, archived: ArchivedFilter): Promise<SavedFilter[]> {
    const [rows, directory] = await Promise.all([
      this.repository.listFilters(user.id, archived),
      this.directory(user),
    ]);

    return rows.map((row) =>
      toSavedFilter(row, directory.get(row.ownerId)?.name ?? null, canEditFilter(user, row)),
    );
  }

  async createFilter(user: RequestUser, input: SaveFilterInput): Promise<SavedFilter> {
    const row = await this.repository.insertFilter(input, user.id);

    return toSavedFilter(row, user.name, true);
  }

  async updateFilter(user: RequestUser, id: string, input: SaveFilterInput): Promise<SavedFilter> {
    await this.editableFilter(user, id);
    const row = await this.repository.updateFilter(id, input);
    if (!row) throw filterNotFound();

    return toSavedFilter(row, null, true);
  }

  /** Arquivar e desarquivar — com a mesma regra de editar. */
  async setFilterArchived(user: RequestUser, id: string, archived: boolean): Promise<SavedFilter> {
    await this.editableFilter(user, id);
    const row = await this.repository.setFilterArchived(id, archived, user.id);
    if (!row) throw filterNotFound();

    return toSavedFilter(row, null, true);
  }

  /**
   * As pessoas do sistema pelo id — para o filtro que guarda o id alcançar a coluna que guarda
   * e-mail ou nome, e para o gráfico mostrar o nome no lugar da chave. Quem pede sempre entra.
   */
  private async directory(user: RequestUser): Promise<Map<string, PersonKeys>> {
    const list = await this.people.list(user).catch(() => null);
    const people = new Map(
      (list?.people ?? []).map((person) => [
        person.id,
        { id: person.id, email: person.email, name: person.name },
      ]),
    );
    people.set(user.id, keysOf(user));

    return people;
  }

  /** O filtro que a pessoa pode usar num bloco: visível para ela, em uso, e da mesma fonte. */
  private async usableFilter(user: RequestUser, id: string, source: string): Promise<SavedFilterRow> {
    const row = await this.repository.findFilter(id);
    if (!row || !canSeeFilter(user, row)) throw filterNotFound();
    if (row.archivedAt) throw new UnprocessableEntityException(`O filtro "${row.name}" está arquivado.`);
    if (row.source !== source) {
      throw new UnprocessableEntityException(`O filtro "${row.name}" é de outra fonte de dados.`);
    }

    return row;
  }

  private async editableFilter(user: RequestUser, id: string): Promise<SavedFilterRow> {
    const row = await this.repository.findFilter(id);
    if (!row || !canSeeFilter(user, row)) throw filterNotFound();
    if (!canEditFilter(user, row)) {
      throw new ForbiddenException('Este filtro é de outra pessoa: só ela ou o gestor mudam.');
    }

    return row;
  }
}

export function canView(user: RequestUser, scope: DashboardScope): boolean {
  return scope !== 'manager' || isManagerRole(user.role);
}

export function canEdit(user: RequestUser, scope: DashboardScope): boolean {
  return scope === 'personal' || isManagerRole(user.role);
}

function assertCanView(user: RequestUser, scope: DashboardScope): void {
  if (canView(user, scope)) return;

  throw new ForbiddenException('O dashboard do gestor é do gestor para cima.');
}

/** Equipe e Gestor são um painel só; o Pessoal é de cada pessoa. */
function ownerOf(user: RequestUser, scope: DashboardScope): string | null {
  return scope === 'personal' ? user.id : null;
}

function canSeeFilter(user: RequestUser, row: SavedFilterRow): boolean {
  return row.scope === 'shared' || row.ownerId === user.id;
}

function canEditFilter(user: RequestUser, row: SavedFilterRow): boolean {
  return row.ownerId === user.id || (row.scope === 'shared' && isManagerRole(user.role));
}

function keysOf(user: RequestUser): PersonKeys {
  return { id: user.id, email: user.email, name: user.name };
}

function dimensionOf(source: DataSourceKey, key: string): CountDimension {
  const dimension = (dimensionsOf(source) as Record<string, { kind: string }>)[key];
  const expression = SOURCE_TABLES[source].dimensions[key];
  if (!dimension || !expression) {
    throw new UnprocessableEntityException(`"${key}" não é um agrupamento desta fonte.`);
  }

  return { key, expression, isTime: dimension.kind !== 'category' };
}

/** Os campos de pessoa de uma fonte — onde o "eu" e a pessoa escolhida valem. */
function personFieldsOf(source: SourceTable): PersonFields {
  const fields: PersonFields = {};
  for (const [name, column] of Object.entries(source.fields)) {
    if (column.person) fields[name] = column.person;
  }

  return fields;
}

/** A pessoa do filtro "Pessoa" do painel: "eu" é quem vê; um id, quem tem aquele id. */
function personOf(
  query: WidgetQuery,
  viewer: PersonKeys,
  directory: ReadonlyMap<string, PersonKeys>,
): PersonKeys | null {
  if (!query.person || !hasPersonField(query.source)) return null;
  if (query.person === ME_VALUE) return viewer;

  return directory.get(query.person) ?? { id: query.person, email: '', name: '' };
}

/** "Pessoa", no banco: o campo de pessoa da fonte é a pessoa escolhida, pelo que ele guarda. */
export function personCondition(source: SourceTable, person: PersonKeys): SQL | undefined {
  const column = source.personField ? source.fields[source.personField] : undefined;
  if (!column?.person) return undefined;
  const value = person[column.person];
  if (!value) return sql`0 = 1`;

  return sql`${column.expression} = ${value}`;
}

/**
 * O recorte do bloco além do filtro: "só os meus", a pessoa e o período do painel, e a janela
 * da agenda. O "Período" do painel, quando escolhido, manda no lugar do período do bloco.
 */
function scopeCondition(
  source: SourceTable,
  query: WidgetQuery,
  viewer: PersonKeys,
  person: PersonKeys | null,
): SQL | undefined {
  const period = query.boardPeriod
    ? windowRange(query.boardPeriod, todayIso())
    : periodRange(query.period, todayIso());

  return and(
    query.onlyMine ? mineCondition(source, viewer) : undefined,
    person ? personCondition(source, person) : undefined,
    period ? sql`${source.periodDay} between ${period.from} and ${period.to}` : undefined,
    windowCondition(source, query),
  );
}

/** "Só os meus": o campo de pessoa da fonte é quem está vendo. */
function mineCondition(source: SourceTable, viewer: PersonKeys): SQL {
  const column = source.personField ? source.fields[source.personField] : undefined;
  if (!column?.person) {
    throw new UnprocessableEntityException('Esta fonte não tem pessoa: "só os meus" não vale aqui.');
  }

  return sql`${column.expression} = ${viewer[column.person]}`;
}

/**
 * A JANELA DA AGENDA, no banco: a data do agrupamento por dia entre as pontas. Janela num
 * agrupamento que não é por dia seria um "tudo" disfarçado, e é recusada.
 */
export function windowCondition(source: SourceTable, query: WidgetQuery): SQL | undefined {
  if (!query.window) return undefined;
  const date = query.groupBy ? source.dayDates?.[query.groupBy] : undefined;
  if (!date) throw new UnprocessableEntityException('A janela da agenda só vale agrupando por dia.');
  const range = windowRange(query.window, todayIso());

  return sql`${date} between ${range.from} and ${range.to}`;
}

/** A árvore do bloco com os filtros de campo do painel: os dois precisam valer (E). */
export function withMatches(tree: FilterGroup | null, matches: readonly BoardMatch[]): FilterGroup | null {
  const group = boardMatchGroup(matches);
  if (!group) return tree;
  if (!tree) return group;

  return { combinator: 'and', rules: [tree, group] };
}

/** O rótulo de cada chave: o nome da pessoa onde a chave é uma pessoa, e o da fonte no resto. */
function labeler(
  source: SourceTable,
  directory: ReadonlyMap<string, PersonKeys>,
): (dimension: string | null, value: string) => string {
  const byKey = new Map<string, string>();
  for (const person of directory.values()) {
    if (person.email) byKey.set(person.email, person.name);
    byKey.set(person.id, person.name);
  }

  return (dimension, value) => {
    if (dimension && source.personDimensions?.includes(dimension)) return byKey.get(value) || value;

    return source.labelOf?.(dimension ?? '', value) ?? value;
  };
}

function toWidgetData(
  counted: CountedWidget,
  query: WidgetQuery,
  label: (dimension: string | null, value: string) => string,
): WidgetData {
  return {
    total: counted.total,
    grandTotal: counted.grandTotal,
    series: counted.groups.map((group) => ({
      key: group.key,
      label: label(query.groupBy, group.key),
      value: group.value,
    })),
    cells: counted.cells.map((cell) => ({
      row: cell.key,
      rowLabel: label(query.groupBy, cell.key),
      column: cell.key2,
      columnLabel: label(query.splitBy, cell.key2),
      value: cell.value,
    })),
  };
}

function filterNotFound(): NotFoundException {
  return new NotFoundException('Filtro não encontrado.');
}
