import { z } from 'zod';

import { archiveSchema } from './archive.schema';
import { type DataDimension, type DataField } from './dashboard-source.types';
import { BOARD_FIELD_FILTERS, DATA_SOURCES } from './dashboard-sources';
import { listSchema, resourceSchema } from './envelope.schema';

export type {
  DataDimension,
  DataField,
  DataFieldType,
  DataSource,
} from './dashboard-source.types';
export { DATA_SOURCES } from './dashboard-sources';

/**
 * OS DASHBOARDS QUE A PESSOA MONTA — três, um por contexto:
 *
 * - `team` (Equipe): todos veem; gestor e administrador editam.
 * - `manager` (Gestor): só gestor e administrador veem e editam.
 * - `personal` (Pessoal): só quem é dono vê e edita — um por pessoa.
 *
 * Cada um é um canvas de 4 colunas com blocos até a cota de pontos (`MAX_BOARD_WEIGHT`, o peso
 * de cada bloco está em `WIDGET_WEIGHTS`). Cada bloco ocupa no mínimo duas casas (duas de
 * largura ou duas de altura) — menos o card com anel, que cabe numa —, e mostra uma FONTE de
 * dados agrupada por um campo, com um FILTRO salvo opcional. Os filtros são do sistema: montados uma vez, servem a
 * qualquer dashboard (e às listas), e podem ser só de quem criou ou compartilhados.
 */
export const DASHBOARD_SCOPES = ['team', 'manager', 'personal'] as const;
export const dashboardScopeSchema = z.enum(DASHBOARD_SCOPES);
export type DashboardScope = z.infer<typeof dashboardScopeSchema>;

export const DASHBOARD_SCOPE_LABELS: Record<DashboardScope, string> = {
  team: 'Equipe',
  manager: 'Gestor',
  personal: 'Pessoal',
};

/**
 * O teto de blocos é só a trava da lista: quem limita o painel é a cota de pontos
 * (`MAX_BOARD_WEIGHT`), e com o bloco mais leve valendo 1 ponto cabem no máximo 24.
 */
export const MAX_WIDGETS = 24;
export const GRID_COLUMNS = 4;
export const MAX_GRID_ROWS = 40;
export const MAX_STAT_CARDS = 4;

/* ---------------------------------------------------------------- fontes de dados */

/* As fontes deste sistema moram em `dashboard-sources.ts` — o único arquivo que o projeto troca. */

/**
 * "EU" NUM FILTRO — o valor que quer dizer "quem está vendo". Um filtro salvo com ele serve a
 * todo mundo: no painel da Equipe, cada pessoa vê o dela. O servidor troca pelo nome de quem
 * pede antes de consultar; nunca chega ao banco como texto.
 */
export const ME_VALUE = '@me';

export type DataSourceKey = keyof typeof DATA_SOURCES;
export const DATA_SOURCE_KEYS = Object.keys(DATA_SOURCES) as DataSourceKey[];
export const dataSourceSchema = z.enum(DATA_SOURCE_KEYS as [DataSourceKey, ...DataSourceKey[]]);

export function fieldsOf(source: DataSourceKey): Record<string, DataField> {
  return DATA_SOURCES[source].fields;
}

export function dimensionsOf(source: DataSourceKey): Record<string, DataDimension> {
  return DATA_SOURCES[source].dimensions;
}

/* ---------------------------------------------------------------- filtro em árvore */

/**
 * O FILTRO, numa árvore de grupos "E"/"OU" — o formato do `react-querybuilder`, para a tela
 * montar com ele e o servidor traduzir em SQL. Os operadores são uma lista fechada, e o campo
 * precisa existir na fonte: o servidor recusa o resto, e nunca monta SQL com texto livre.
 */
export const FILTER_OPERATORS = [
  '=',
  '!=',
  'in',
  'notIn',
  'contains',
  'doesNotContain',
  'beginsWith',
  '<',
  '<=',
  '>',
  '>=',
  'between',
  'null',
  'notNull',
] as const;

export const filterOperatorSchema = z.enum(FILTER_OPERATORS);

const filterValueSchema = z.union([
  z.string().max(200),
  z.number(),
  z.boolean(),
  z.null(),
  z.array(z.union([z.string().max(200), z.number()])).max(100),
]);

export const filterRuleSchema = z.object({
  id: z.string().max(80).optional(),
  field: z.string().min(1).max(60),
  operator: filterOperatorSchema,
  value: filterValueSchema.optional(),
});

export type FilterRule = z.infer<typeof filterRuleSchema>;

export type FilterGroup = {
  id?: string;
  combinator: 'and' | 'or';
  not?: boolean;
  rules: (FilterRule | FilterGroup)[];
};

/** Até 4 níveis e 50 regras: um filtro maior que isso é um relatório, não um filtro. */
export const MAX_FILTER_DEPTH = 4;
export const MAX_FILTER_RULES = 50;

export const filterGroupSchema: z.ZodType<FilterGroup> = z.lazy(() =>
  z.object({
    id: z.string().max(80).optional(),
    combinator: z.enum(['and', 'or']),
    not: z.boolean().optional(),
    rules: z.array(z.union([filterRuleSchema, filterGroupSchema])).max(MAX_FILTER_RULES),
  }),
);

export function isFilterGroup(node: FilterRule | FilterGroup): node is FilterGroup {
  return 'rules' in node;
}

/** Profundidade e número de regras da árvore — o limite que protege o banco. */
export function filterSize(group: FilterGroup, depth = 1): { depth: number; rules: number } {
  let maxDepth = depth;
  let rules = 0;
  for (const node of group.rules) {
    if (!isFilterGroup(node)) {
      rules += 1;
      continue;
    }
    const inner = filterSize(node, depth + 1);
    maxDepth = Math.max(maxDepth, inner.depth);
    rules += inner.rules;
  }

  return { depth: maxDepth, rules };
}

/** Os problemas de uma árvore para uma fonte — vazio quando dá para usar. */
export function filterProblems(source: DataSourceKey, group: FilterGroup): string[] {
  const size = filterSize(group);
  const problems: string[] = [];
  if (size.depth > MAX_FILTER_DEPTH)
    problems.push(`O filtro passa de ${MAX_FILTER_DEPTH} níveis de grupo.`);
  if (size.rules > MAX_FILTER_RULES)
    problems.push(`O filtro passa de ${MAX_FILTER_RULES} condições.`);
  const fields = fieldsOf(source);
  const visit = (node: FilterGroup) => {
    for (const rule of node.rules) {
      if (isFilterGroup(rule)) {
        visit(rule);
        continue;
      }
      if (!(rule.field in fields))
        problems.push(`"${rule.field}" não é um campo de ${DATA_SOURCES[source].label}.`);
    }
  };
  visit(group);

  return problems;
}

export const EMPTY_FILTER: FilterGroup = { combinator: 'and', rules: [] };

/* ---------------------------------------------------------------- filtros salvos */

export const SAVED_FILTER_SCOPES = ['personal', 'shared'] as const;

export const savedFilterSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  description: z.string().nullable(),
  source: dataSourceSchema,
  scope: z.enum(SAVED_FILTER_SCOPES),
  tree: filterGroupSchema,
  ownerId: z.string(),
  ownerName: z.string().nullable(),
  canEdit: z.boolean(),
  archive: archiveSchema,
  updatedAt: z.iso.datetime({ offset: true }),
});

export type SavedFilter = z.infer<typeof savedFilterSchema>;

export const saveFilterSchema = z
  .object({
    name: z.string().trim().min(2, 'Dê um nome ao filtro').max(80),
    description: z.string().trim().max(240).nullish(),
    source: dataSourceSchema,
    scope: z.enum(SAVED_FILTER_SCOPES),
    tree: filterGroupSchema,
  })
  .superRefine((value, context) => {
    for (const message of filterProblems(value.source, value.tree)) {
      context.addIssue({ code: 'custom', message, path: ['tree'] });
    }
  });

export type SaveFilterInput = z.infer<typeof saveFilterSchema>;

export const savedFilterListSchema = listSchema('filters', savedFilterSchema);
export type SavedFilterList = z.infer<typeof savedFilterListSchema>;
export const savedFilterResourceSchema = resourceSchema('filter', savedFilterSchema);
export type SavedFilterResource = z.infer<typeof savedFilterResourceSchema>;

/* ---------------------------------------------------------------- blocos e canvas */

export const WIDGET_KINDS = [
  'stats',
  'hero',
  'column',
  'bar',
  'donut',
  'area',
  'calendar',
  'list',
  'radar',
  'treemap',
  'radial',
  'stacked',
  'heatmap',
  'sankey',
  'agenda',
  'pie',
  'rose',
  'halfDonut',
  'pareto',
  'cumulative',
  'grouped',
  'ringCard',
] as const;
export const widgetKindSchema = z.enum(WIDGET_KINDS);
export type WidgetKind = z.infer<typeof widgetKindSchema>;

export const WIDGET_KIND_LABELS: Record<WidgetKind, string> = {
  stats: 'Cards de número (um por grupo, até 4)',
  hero: 'Destaque com o Zuzu',
  column: 'Colunas',
  bar: 'Barras deitadas',
  donut: 'Rosca',
  area: 'Linha no tempo',
  calendar: 'Calendário',
  list: 'Lista ordenada',
  radar: 'Radar (teia)',
  treemap: 'Mapa de blocos',
  radial: 'Medidor (o filtro sobre o total)',
  stacked: 'Barras empilhadas (dois agrupamentos)',
  heatmap: 'Mapa de calor (dois agrupamentos)',
  sankey: 'Fluxo (dois agrupamentos)',
  agenda: 'Agenda (quantos por dia, numa janela de até 90 dias)',
  pie: 'Pizza',
  rose: 'Rosa (o raio de cada fatia é o valor)',
  halfDonut: 'Meia-rosca',
  pareto: 'Pareto (barras em ordem e o percentual acumulado)',
  cumulative: 'Acumulado no tempo',
  grouped: 'Colunas lado a lado (dois agrupamentos)',
  ringCard: 'Card com anel (o filtro sobre o total)',
};

/** Os blocos que precisam de um agrupamento no tempo, e os que agrupam por categoria. */
export const TIME_WIDGETS: readonly WidgetKind[] = ['area', 'calendar', 'agenda', 'cumulative'];
/** Os que mostram um dia por casa: só aceitam agrupamento POR DIA (não por mês). */
export const DAY_WIDGETS: readonly WidgetKind[] = ['calendar', 'agenda'];
export const CATEGORY_WIDGETS: readonly WidgetKind[] = [
  'column',
  'bar',
  'donut',
  'list',
  'radar',
  'treemap',
  'pie',
  'rose',
  'halfDonut',
  'pareto',
];
/** Os que cruzam DUAS categorias: o agrupamento e o "dividir por" (`splitBy`). */
export const PAIR_WIDGETS: readonly WidgetKind[] = ['stacked', 'heatmap', 'sankey', 'grouped'];
/** Os de cards: agrupar é opcional — sem agrupar, o total; agrupando, um card por grupo (até 4). */
export const CARD_WIDGETS: readonly WidgetKind[] = ['stats', 'hero'];

/**
 * O PESO DE CADA BLOCO — o quanto ele custa ao banco, e não o espaço que ocupa. O painel tem
 * uma cota de pontos (`MAX_BOARD_WEIGHT`) em vez de um número fixo de blocos: dez blocos
 * tratavam igual um card de um número só e um mapa de calor que cruza dois agrupamentos.
 *
 * 1: um número só · 2: uma contagem agrupada · 3: uma série no tempo · 4: dois agrupamentos.
 * "Números" só agrupa se a pessoa quiser: sem agrupar, é um número (peso 1).
 */
export const WIDGET_WEIGHTS: Record<WidgetKind, number> = {
  ringCard: 1,
  radial: 1,
  stats: 2,
  hero: 2,
  column: 2,
  bar: 2,
  donut: 2,
  pie: 2,
  rose: 2,
  halfDonut: 2,
  list: 2,
  radar: 2,
  treemap: 2,
  pareto: 2,
  area: 3,
  cumulative: 3,
  calendar: 3,
  agenda: 3,
  stacked: 4,
  heatmap: 4,
  sankey: 4,
  grouped: 4,
};

/** A cota de um painel: doze gráficos comuns, vinte e quatro cards de um número, ou seis cruzados. */
export const MAX_BOARD_WEIGHT = 24;

export function widgetWeight(widget: { kind: WidgetKind; groupBy?: string | null }): number {
  if (widget.kind === 'stats' && !widget.groupBy) return 1;

  return WIDGET_WEIGHTS[widget.kind];
}

export function boardWeight(
  widgets: readonly { kind: WidgetKind; groupBy?: string | null }[],
): number {
  return widgets.reduce((sum, widget) => sum + widgetWeight(widget), 0);
}

/** "1 ponto", "4 pontos" — o rótulo do peso que a tela mostra em cada bloco. */
export function weightLabel(weight: number): string {
  return weight === 1 ? '1 ponto' : `${weight} pontos`;
}

/**
 * O PERÍODO DO BLOCO — a janela de tempo sobre a data principal da fonte (vencimento não: a
 * data de quando o registro aconteceu). Relativo ao dia de quem vê, em Brasília: "hoje" é
 * sempre hoje, sem ninguém ter de mexer no filtro.
 */
export const WIDGET_PERIODS = ['all', 'today', '7d', '30d', 'month'] as const;
export const widgetPeriodSchema = z.enum(WIDGET_PERIODS);
export type WidgetPeriod = z.infer<typeof widgetPeriodSchema>;

export const WIDGET_PERIOD_LABELS: Record<WidgetPeriod, string> = {
  all: 'Todo o período',
  today: 'Hoje',
  '7d': 'Últimos 7 dias',
  '30d': 'Últimos 30 dias',
  month: 'Este mês',
};

/** Os dias (`aaaa-mm-dd`, pontas incluídas) de um período, contados a partir de `today`. */
export function periodRange(
  period: WidgetPeriod,
  today: string,
): { from: string; to: string } | null {
  if (period === 'all') return null;
  if (period === 'today') return { from: today, to: today };
  if (period === 'month') return { from: `${today.slice(0, 7)}-01`, to: today };
  const back = period === '7d' ? 6 : 29;
  const start = new Date(`${today}T00:00:00.000Z`);
  start.setUTCDate(start.getUTCDate() - back);

  return { from: start.toISOString().slice(0, 10), to: today };
}

/**
 * A JANELA DA AGENDA — quantos dias ela puxa do banco. Nunca "tudo": ou os próximos/últimos N
 * dias, semanas ou meses (a partir do começo do dia, da semana ou do mês de hoje), ou duas datas
 * exatas com no máximo 90 dias entre elas. Sem esse teto, um painel pedindo dois anos de agenda,
 * renovado a cada 5 minutos por cada pessoa, pesaria no banco de todo mundo.
 */
export const MAX_WINDOW_DAYS = 90;
export const WINDOW_UNITS = ['day', 'week', 'month'] as const;
export type WindowUnit = (typeof WINDOW_UNITS)[number];
export const WINDOW_DIRECTIONS = ['next', 'last'] as const;

/** As quantidades que cada unidade oferece — escolha fechada, sempre dentro dos 90 dias. */
export const WINDOW_COUNTS: Record<WindowUnit, readonly number[]> = {
  day: [7, 14, 30, 60, 90],
  week: [1, 2, 4, 8, 12],
  month: [1, 2, 3],
};

export const WINDOW_UNIT_LABELS: Record<WindowUnit, [string, string]> = {
  day: ['dia', 'dias'],
  week: ['semana', 'semanas'],
  month: ['mês', 'meses'],
};

const isoDay = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use uma data válida');

export const widgetWindowSchema = z
  .discriminatedUnion('mode', [
    z.object({
      mode: z.literal('relative'),
      unit: z.enum(WINDOW_UNITS),
      count: z.number().int().min(1),
      direction: z.enum(WINDOW_DIRECTIONS),
    }),
    z.object({ mode: z.literal('custom'), from: isoDay, to: isoDay }),
  ])
  .superRefine((window, context) => {
    const problem = windowProblem(window);
    if (problem) context.addIssue({ code: 'custom', message: problem });
  });

export type WidgetWindow = z.infer<typeof widgetWindowSchema>;

/** A janela padrão da agenda: o mês de hoje, pra frente. */
export const DEFAULT_WINDOW: WidgetWindow = {
  mode: 'relative',
  unit: 'month',
  count: 1,
  direction: 'next',
};

function windowProblem(window: WidgetWindow): string | null {
  if (window.mode === 'relative') {
    return WINDOW_COUNTS[window.unit].includes(window.count)
      ? null
      : 'Escolha uma das quantidades oferecidas';
  }
  if (window.from > window.to) return 'A data final vem antes da inicial';

  return daysBetween(window.from, window.to) + 1 > MAX_WINDOW_DAYS
    ? `A agenda puxa no máximo ${MAX_WINDOW_DAYS} dias`
    : null;
}

function addDays(day: string, days: number): string {
  const date = new Date(`${day}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);

  return date.toISOString().slice(0, 10);
}

function addMonths(day: string, months: number): string {
  const date = new Date(`${day}T00:00:00.000Z`);
  date.setUTCMonth(date.getUTCMonth() + months);

  return date.toISOString().slice(0, 10);
}

function daysBetween(from: string, to: string): number {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000);
}

/** O começo do dia, da semana (domingo, como o calendário da tela) ou do mês de `today`. */
function startOfUnit(unit: WindowUnit, today: string): string {
  if (unit === 'month') return `${today.slice(0, 7)}-01`;
  if (unit === 'day') return today;

  return addDays(today, -new Date(`${today}T00:00:00.000Z`).getUTCDay());
}

function plusUnits(unit: WindowUnit, day: string, count: number): string {
  if (unit === 'month') return addMonths(day, count);

  return addDays(day, unit === 'week' ? count * 7 : count);
}

/**
 * Os dias (pontas incluídas) de uma janela, a partir de `today`. "Próximos 2 meses" é este mês
 * e o seguinte, inteiros; "últimas 4 semanas" são as três de antes e esta, até hoje.
 */
export function windowRange(window: WidgetWindow, today: string): { from: string; to: string } {
  if (window.mode === 'custom') return { from: window.from, to: window.to };
  const start = startOfUnit(window.unit, today);
  if (window.direction === 'next') {
    return { from: start, to: addDays(plusUnits(window.unit, start, window.count), -1) };
  }

  return { from: plusUnits(window.unit, start, -(window.count - 1)), to: today };
}

/** "Próximos 2 meses", "Últimos 30 dias", "01/11/2026 a 30/11/2026". */
export function windowLabel(window: WidgetWindow): string {
  if (window.mode === 'custom') return `${brazilian(window.from)} a ${brazilian(window.to)}`;
  const plural = window.count === 1 ? 0 : 1;
  const gender = window.unit === 'week' ? 'feminine' : 'masculine';
  const word = DIRECTION_WORDS[window.direction][gender][plural];

  return `${word} ${window.count} ${WINDOW_UNIT_LABELS[window.unit][plural]}`;
}

/** "Próximos/Próximas", "Últimos/Últimas" — semana é feminina. */
const DIRECTION_WORDS = {
  next: { masculine: ['Próximo', 'Próximos'], feminine: ['Próxima', 'Próximas'] },
  last: { masculine: ['Último', 'Últimos'], feminine: ['Última', 'Últimas'] },
} as const;

function brazilian(day: string): string {
  const [year, month, date] = day.split('-');

  return `${date}/${month}/${year}`;
}

/** A fonte tem um campo de pessoa — e por isso aceita "só os meus". */
export function hasPersonField(source: DataSourceKey): boolean {
  return Object.values(fieldsOf(source)).some((field) => field.isPerson);
}

/**
 * O agrupamento que o bloco pede tem que combinar com o gráfico: os de tempo agrupam por dia ou
 * mês, os de categoria por categoria, os de par cruzam duas categorias diferentes, e os cards
 * agrupam se quiserem (um card por grupo) — o destaque com o Zuzu também: os grupos viram os
 * até quatro cards dentro dele.
 */
function groupProblem(widget: {
  kind: WidgetKind;
  source: DataSourceKey;
  groupBy: string | null;
  splitBy?: string | null;
}): string | null {
  const dimensions = dimensionsOf(widget.source) as Record<string, DataDimension>;
  const dimension = widget.groupBy ? dimensions[widget.groupBy] : undefined;
  if (CARD_WIDGETS.includes(widget.kind)) return statsGroupProblem(widget.groupBy, dimension);
  if (PAIR_WIDGETS.includes(widget.kind)) return pairProblem(widget, dimensions);
  const wantsTime = TIME_WIDGETS.includes(widget.kind);
  if (!wantsTime && !CATEGORY_WIDGETS.includes(widget.kind)) return null;
  if (!dimension) return 'Escolha como agrupar';

  return kindProblem(widget.kind, wantsTime, dimension);
}

/** O agrupamento escolhido combina com o tipo? A agenda só aceita POR DIA (não por mês). */
function kindProblem(
  kind: WidgetKind,
  wantsTime: boolean,
  dimension: DataDimension,
): string | null {
  if (kind === 'agenda' && dimension.kind !== 'day') return 'A agenda agrupa por dia';
  if (wantsTime === (dimension.kind !== 'category')) return null;

  return wantsTime ? 'Este bloco agrupa no tempo' : 'Este bloco agrupa por categoria';
}

function pairProblem(
  widget: { groupBy: string | null; splitBy?: string | null },
  dimensions: Record<string, DataDimension>,
): string | null {
  const first = widget.groupBy ? dimensions[widget.groupBy] : undefined;
  const second = widget.splitBy ? dimensions[widget.splitBy] : undefined;
  if (first?.kind !== 'category' || second?.kind !== 'category') {
    return 'Este bloco cruza duas categorias: escolha as duas';
  }

  return widget.groupBy === widget.splitBy ? 'Escolha duas categorias diferentes' : null;
}

function statsGroupProblem(
  groupBy: string | null,
  dimension: DataDimension | undefined,
): string | null {
  if (groupBy === null || dimension?.kind === 'category') return null;

  return 'Os cards agrupam por categoria';
}

export const widgetSchema = z
  .object({
    id: z.string().min(1).max(40),
    kind: widgetKindSchema,
    title: z.string().trim().min(1, 'Dê um título ao bloco').max(60),
    source: dataSourceSchema,
    groupBy: z.string().max(40).nullable(),
    /** O segundo agrupamento dos blocos de par. Nulo nos outros (e nos painéis já salvos). */
    splitBy: z.string().max(40).nullable().default(null),
    filterId: z.uuid().nullable(),
    /** Só o que é de quem está vendo — no painel da Equipe, cada um vê o seu. */
    onlyMine: z.boolean().default(false),
    period: widgetPeriodSchema.default('all'),
    /** A janela da agenda (até 90 dias). Nula nos outros blocos — e nos painéis já salvos. */
    window: widgetWindowSchema.nullable().default(null),
  })
  .superRefine((widget, context) => {
    const problem = groupProblem(widget);
    if (problem) context.addIssue({ code: 'custom', message: problem, path: ['groupBy'] });
    if (widget.kind === 'agenda' && !widget.window) {
      context.addIssue({
        code: 'custom',
        message: 'Escolha o período da agenda',
        path: ['window'],
      });
    }
    if (widget.onlyMine && !hasPersonField(widget.source)) {
      context.addIssue({
        code: 'custom',
        message: 'Esta fonte não tem responsável: "só os meus" não vale aqui',
        path: ['onlyMine'],
      });
    }
  });

export type Widget = z.infer<typeof widgetSchema>;

/** Os blocos que cabem numa casa só (1×1). Os outros ocupam no mínimo duas. */
export const COMPACT_WIDGET_KINDS: readonly WidgetKind[] = ['ringCard'];

export const MIN_CELLS_PROBLEM = 'O bloco ocupa no mínimo duas casas';

/**
 * Onde cada bloco fica no canvas de 4 colunas. O item sozinho aceita 1×1: quem decide se o bloco
 * cabe numa casa é o tipo dele (`COMPACT_WIDGET_KINDS`), conferido no `saveBoardSchema`, que
 * conhece os dois.
 */
export const layoutItemSchema = z
  .object({
    i: z.string().min(1).max(40),
    x: z
      .number()
      .int()
      .min(0)
      .max(GRID_COLUMNS - 1),
    y: z.number().int().min(0).max(MAX_GRID_ROWS),
    w: z.number().int().min(1).max(GRID_COLUMNS),
    h: z.number().int().min(1).max(8),
  })
  .refine((item) => item.x + item.w <= GRID_COLUMNS, { message: 'O bloco passa da borda' });

export type LayoutItem = z.infer<typeof layoutItemSchema>;

/* ---------------------------------------------------------------- os filtros do painel */

/**
 * OS FILTROS DO PAINEL — postos por quem monta, escolhidos por quem vê. Ficam no alto do painel
 * e valem para TODOS os blocos de uma vez: "Pessoa" recorta pelo responsável (ou por quem fez)
 * em cada bloco cuja fonte tem pessoa; "Período" troca o período de cada bloco por uma janela
 * de até 90 dias. Bloco cuja fonte não tem pessoa segue igual — o filtro não se aplica a ele.
 *
 * O painel grava QUAIS filtros existem; o valor escolhido é de quem está vendo, e não se grava.
 */
/**
 * OS FILTROS DE CAMPO — um valor escolhido vira uma condição "campo = valor" no bloco, a MESMA
 * condição que um filtro salvo teria. Não abre consulta nova: entra na pergunta que o bloco já
 * faz. Cada um vale só nas fontes onde o campo existe; nas outras, o bloco segue igual. Os de
 * cada sistema moram em `dashboard-sources.ts`.
 */
export type BoardFieldFilterKind = keyof typeof BOARD_FIELD_FILTERS;

export const BOARD_FIELD_FILTER_KINDS = Object.keys(BOARD_FIELD_FILTERS) as BoardFieldFilterKind[];

export const BOARD_FILTER_KINDS = ['person', 'period', ...BOARD_FIELD_FILTER_KINDS] as const;
export const boardFilterKindSchema = z.enum(
  BOARD_FILTER_KINDS as unknown as [BoardFilterKind, ...BoardFilterKind[]],
);
export type BoardFilterKind = 'person' | 'period' | BoardFieldFilterKind;

export const BOARD_FILTER_KIND_LABELS = {
  person: 'Pessoa',
  period: 'Período',
  ...Object.fromEntries(
    BOARD_FIELD_FILTER_KINDS.map((kind) => [kind, BOARD_FIELD_FILTERS[kind].label]),
  ),
} as Record<BoardFilterKind, string>;

export const BOARD_FILTER_FIELDS = Object.fromEntries(
  BOARD_FIELD_FILTER_KINDS.map((kind) => [kind, BOARD_FIELD_FILTERS[kind].fields]),
) as Record<BoardFieldFilterKind, Partial<Record<DataSourceKey, string>>>;

export function isFieldFilterKind(kind: BoardFilterKind): kind is BoardFieldFilterKind {
  return kind in BOARD_FILTER_FIELDS;
}

export const boardFilterSchema = z.object({
  id: z.string().min(1).max(40),
  kind: boardFilterKindSchema,
  label: z.string().trim().min(1, 'Dê um nome ao filtro').max(40),
});

export type BoardFilter = z.infer<typeof boardFilterSchema>;

/** Um de cada tipo: duas "Pessoa" no mesmo painel seriam duas respostas para a mesma pergunta. */
export const MAX_BOARD_FILTERS = BOARD_FILTER_KINDS.length;

/** O que quem vê escolheu em cada filtro do painel. Nulo é "todos" / o período de cada bloco. */
export type BoardFilterValues = { person: string | null; period: WidgetWindow | null } & Record<
  BoardFieldFilterKind,
  string | null
>;

export const EMPTY_BOARD_FILTER_VALUES = {
  person: null,
  period: null,
  ...Object.fromEntries(BOARD_FIELD_FILTER_KINDS.map((kind) => [kind, null])),
} as BoardFilterValues;

/**
 * O filtro do painel vale para a fonte do bloco? Período vale para todas; pessoa, só com pessoa;
 * os de campo, só onde o campo existe.
 */
export function boardFilterApplies(kind: BoardFilterKind, source: DataSourceKey): boolean {
  if (kind === 'period') return true;
  if (kind === 'person') return hasPersonField(source);

  return BOARD_FILTER_FIELDS[kind][source] !== undefined;
}

/** As condições "campo = valor" que os filtros de campo escolhidos põem num bloco desta fonte. */
export function boardMatches(values: BoardFilterValues, source: DataSourceKey): BoardMatch[] {
  return BOARD_FIELD_FILTER_KINDS.flatMap((kind) => {
    const field = BOARD_FILTER_FIELDS[kind][source];
    const value = values[kind];

    return field && value ? [{ field, value }] : [];
  });
}

export const boardMatchSchema = z.object({
  field: z.string().min(1).max(60),
  value: z.string().trim().min(1).max(200),
});

export type BoardMatch = z.infer<typeof boardMatchSchema>;

/** Os filtros de campo de um bloco como um grupo E — a mesma árvore de um filtro salvo. */
export function boardMatchGroup(matches: readonly BoardMatch[]): FilterGroup | null {
  if (matches.length === 0) return null;

  return {
    combinator: 'and',
    rules: matches.map(({ field, value }) => ({ field, operator: '=', value })),
  };
}

export const saveBoardSchema = z
  .object({
    widgets: z
      .array(widgetSchema)
      .max(MAX_WIDGETS, `No máximo ${MAX_WIDGETS} blocos por dashboard`),
    layout: z.array(layoutItemSchema).max(MAX_WIDGETS),
    /* Os painéis gravados antes dos filtros não têm o campo: chegam sem filtro nenhum. */
    filters: z.array(boardFilterSchema).max(MAX_BOARD_FILTERS).default([]),
  })
  .superRefine((board, context) => {
    const kinds = new Set(board.filters.map((filter) => filter.kind));
    if (kinds.size !== board.filters.length) {
      context.addIssue({
        code: 'custom',
        message: 'O painel tem um filtro de cada tipo',
        path: ['filters'],
      });
    }
    const ids = new Set(board.widgets.map((widget) => widget.id));
    if (ids.size !== board.widgets.length) {
      context.addIssue({
        code: 'custom',
        message: 'Dois blocos com o mesmo id',
        path: ['widgets'],
      });
    }
    const placed = new Set(board.layout.map((item) => item.i));
    if (placed.size !== ids.size || [...ids].some((id) => !placed.has(id))) {
      context.addIssue({
        code: 'custom',
        message: 'Todo bloco precisa de um lugar no canvas',
        path: ['layout'],
      });
    }
    const kindOf = new Map(board.widgets.map((widget) => [widget.id, widget.kind]));
    board.layout.forEach((item, index) => {
      if (item.w >= 2 || item.h >= 2) return;
      const kind = kindOf.get(item.i);
      if (kind && COMPACT_WIDGET_KINDS.includes(kind)) return;
      context.addIssue({ code: 'custom', message: MIN_CELLS_PROBLEM, path: ['layout', index] });
    });
  });

export type SaveBoardInput = z.infer<typeof saveBoardSchema>;

export const boardSchema = z.object({
  scope: dashboardScopeSchema,
  widgets: z.array(widgetSchema),
  layout: z.array(layoutItemSchema),
  filters: z.array(boardFilterSchema).default([]),
  /** Nulo enquanto ninguém salvou: é o painel padrão do sistema. */
  updatedAt: z.iso.datetime({ offset: true }).nullable(),
  updatedBy: z.string().nullable(),
  canEdit: z.boolean(),
});

export type Board = z.infer<typeof boardSchema>;

export const boardResourceSchema = resourceSchema('board', boardSchema);
export type BoardResource = z.infer<typeof boardResourceSchema>;

/* ---------------------------------------------------------------- os dados de um bloco */

export const widgetQuerySchema = z.object({
  source: dataSourceSchema,
  groupBy: z.string().max(40).nullable(),
  splitBy: z.string().max(40).nullable().default(null),
  filterId: z.uuid().nullable(),
  onlyMine: z.boolean().default(false),
  period: widgetPeriodSchema.default('all'),
  /** Recorta o AGRUPAMENTO POR DIA a esta janela — o teto de 90 dias vale aqui também. */
  window: widgetWindowSchema.nullable().default(null),
  /** O filtro "Pessoa" do painel: o ID escolhido, ou `ME_VALUE`. Fonte sem pessoa ignora. */
  person: z.string().trim().min(1).max(200).nullable().default(null),
  /** O filtro "Período" do painel: no lugar do período do bloco, com o mesmo teto de 90 dias. */
  boardPeriod: widgetWindowSchema.nullable().default(null),
  /** Os filtros de campo do painel (status, tipo, situação, grupo, cidade): "campo = valor". */
  matches: z.array(boardMatchSchema).max(BOARD_FIELD_FILTER_KINDS.length).default([]),
});

export type WidgetQuery = z.infer<typeof widgetQuerySchema>;
export type WidgetQueryInput = z.input<typeof widgetQuerySchema>;

export const widgetDataSchema = z.object({
  /** Quantos há no recorte (com o filtro). */
  total: z.number().int().min(0),
  /** Quantos há na fonte inteira, sem o filtro — o "de quanto" do medidor. */
  grandTotal: z.number().int().min(0),
  series: z.array(z.object({ key: z.string(), label: z.string(), value: z.number() })),
  /** O cruzamento dos blocos de par: uma célula por (grupo, divisão). Vazio nos outros. */
  cells: z.array(
    z.object({
      row: z.string(),
      rowLabel: z.string(),
      column: z.string(),
      columnLabel: z.string(),
      value: z.number(),
    }),
  ),
});

export type WidgetData = z.infer<typeof widgetDataSchema>;

export const widgetDataResourceSchema = resourceSchema('result', widgetDataSchema);
export type WidgetDataResource = z.infer<typeof widgetDataResourceSchema>;
