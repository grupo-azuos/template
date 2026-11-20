import { describe, expect, it } from 'vitest';

import {
  boardFilterApplies,
  boardMatches,
  boardMatchGroup,
  boardWeight,
  DEFAULT_WINDOW,
  EMPTY_BOARD_FILTER_VALUES,
  type FilterGroup,
  filterProblems,
  filterSize,
  layoutItemSchema,
  MAX_BOARD_WEIGHT,
  MAX_WIDGETS,
  MIN_CELLS_PROBLEM,
  periodRange,
  saveBoardSchema,
  saveFilterSchema,
  WIDGET_KINDS,
  WIDGET_WEIGHTS,
  weightLabel,
  widgetQuerySchema,
  widgetSchema,
  widgetWeight,
  widgetWindowSchema,
  windowLabel,
  windowRange,
} from './dashboard-board.schema';

/* As fontes do template são as de exemplo (`dashboard-sources.ts`): tarefas e o movimento. */
const WIDGET = {
  id: 'w1',
  kind: 'column',
  title: 'Tarefas por status',
  source: 'tasks',
  groupBy: 'status',
  filterId: null,
};

describe('widgetSchema', () => {
  // feliz
  it('accepts a column block grouped by category', () => {
    expect(widgetSchema.parse(WIDGET).groupBy).toBe('status');
  });

  // triste
  it('rejects a time block grouped by category and a grouping the source lacks', () => {
    expect(widgetSchema.safeParse({ ...WIDGET, kind: 'calendar' }).success).toBe(false);
    expect(widgetSchema.safeParse({ ...WIDGET, groupBy: 'cor' }).success).toBe(false);
    expect(widgetSchema.safeParse({ ...WIDGET, kind: 'stats', groupBy: null }).success).toBe(true);
    expect(
      widgetSchema.safeParse({ ...WIDGET, kind: 'stats', groupBy: 'createdDay' }).success,
    ).toBe(false);
  });

  // feliz
  it('fills new defaults into older blocks, and lets pair blocks cross two categories', () => {
    expect(widgetSchema.parse(WIDGET)).toMatchObject({
      splitBy: null,
      onlyMine: false,
      period: 'all',
    });
    expect(
      widgetSchema.safeParse({ ...WIDGET, kind: 'stacked', splitBy: 'createdBy', onlyMine: true })
        .success,
    ).toBe(true);
  });

  // triste
  it('rejects a pair without a second or with a repeated category', () => {
    expect(widgetSchema.safeParse({ ...WIDGET, kind: 'heatmap' }).success).toBe(false);
    expect(widgetSchema.safeParse({ ...WIDGET, kind: 'sankey', splitBy: 'status' }).success).toBe(
      false,
    );
  });

  // feliz
  it('accepts the new charts with the grouping each one needs', () => {
    for (const kind of ['pie', 'rose', 'halfDonut', 'pareto']) {
      expect(widgetSchema.safeParse({ ...WIDGET, kind }).success).toBe(true);
    }
    expect(
      widgetSchema.safeParse({ ...WIDGET, kind: 'cumulative', groupBy: 'createdMonth' }).success,
    ).toBe(true);
    expect(
      widgetSchema.safeParse({ ...WIDGET, kind: 'grouped', splitBy: 'createdBy' }).success,
    ).toBe(true);
  });

  // triste
  it('rejects an accumulated line by category and side-by-side columns without a second one', () => {
    expect(widgetSchema.safeParse({ ...WIDGET, kind: 'cumulative' }).success).toBe(false);
    expect(widgetSchema.safeParse({ ...WIDGET, kind: 'grouped' }).success).toBe(false);
  });
});

describe('periodRange', () => {
  // feliz
  it('counts the days from today, ends included', () => {
    expect(periodRange('today', '2026-11-07')).toEqual({ from: '2026-11-07', to: '2026-11-07' });
    expect(periodRange('7d', '2026-11-07')).toEqual({ from: '2026-11-01', to: '2026-11-07' });
    expect(periodRange('month', '2026-11-07')).toEqual({ from: '2026-11-01', to: '2026-11-07' });
  });

  // triste
  it('does not cut on "all", and lets 30 days cross the month', () => {
    expect(periodRange('all', '2026-11-07')).toBeNull();
    expect(periodRange('30d', '2026-11-07')?.from).toBe('2026-10-09');
  });
});

describe('layoutItemSchema', () => {
  // feliz
  it('accepts 2 wide or 2 tall', () => {
    expect(layoutItemSchema.safeParse({ i: 'a', x: 0, y: 0, w: 2, h: 1 }).success).toBe(true);
    expect(layoutItemSchema.safeParse({ i: 'a', x: 3, y: 0, w: 1, h: 2 }).success).toBe(true);
  });

  // triste
  it('rejects blocks past the edge, and leaves 1x1 to the board, which knows the kind', () => {
    expect(layoutItemSchema.safeParse({ i: 'a', x: 3, y: 0, w: 2, h: 2 }).success).toBe(false);
    expect(layoutItemSchema.safeParse({ i: 'a', x: 0, y: 0, w: 1, h: 1 }).success).toBe(true);
  });
});

describe('saveBoardSchema', () => {
  // triste
  /* O teto da lista (24) é só a trava contra um pedido absurdo; quem limita o painel é a cota de
     pontos, conferida no servidor. */
  it('rejects more blocks than the list cap and blocks without a place', () => {
    const widgets = Array.from({ length: MAX_WIDGETS + 1 }, (_, index) => ({
      ...WIDGET,
      id: `w${index}`,
    }));
    const layout = widgets.map((widget, index) => ({
      i: widget.id,
      x: 0,
      y: index * 2,
      w: 2,
      h: 2,
    }));
    expect(saveBoardSchema.safeParse({ widgets, layout }).success).toBe(false);
    expect(saveBoardSchema.safeParse({ widgets: [WIDGET], layout: [] }).success).toBe(false);
  });

  // feliz
  it('accepts a board with every block placed', () => {
    expect(
      saveBoardSchema.safeParse({
        widgets: [WIDGET],
        layout: [{ i: 'w1', x: 0, y: 0, w: 2, h: 2 }],
      }).success,
    ).toBe(true);
  });

  // feliz
  /* A tela deixa o card com anel em 1x1: o contrato precisa aceitar, ou o painel não salva. */
  it('accepts a ring card in a single cell', () => {
    const ring = { ...WIDGET, id: 'r1', kind: 'ringCard', groupBy: null };
    expect(
      saveBoardSchema.safeParse({
        widgets: [WIDGET, ring],
        layout: [
          { i: 'w1', x: 0, y: 0, w: 2, h: 2 },
          { i: 'r1', x: 2, y: 0, w: 1, h: 1 },
        ],
      }).success,
    ).toBe(true);
  });

  // triste
  it('rejects any other block in a single cell, pointing at its place', () => {
    const result = saveBoardSchema.safeParse({
      widgets: [WIDGET],
      layout: [{ i: 'w1', x: 0, y: 0, w: 1, h: 1 }],
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]).toMatchObject({
      message: MIN_CELLS_PROBLEM,
      path: ['layout', 0],
    });
  });
});

describe('widget weights', () => {
  // feliz
  it('weighs each block by what it costs, and sums the board', () => {
    expect(widgetWeight({ kind: 'ringCard' })).toBe(1);
    expect(widgetWeight({ kind: 'stats', groupBy: null })).toBe(1);
    expect(widgetWeight({ kind: 'stats', groupBy: 'status' })).toBe(2);
    expect(widgetWeight({ kind: 'area' })).toBe(3);
    expect(widgetWeight({ kind: 'heatmap' })).toBe(4);
    expect(boardWeight([{ kind: 'ringCard' }, { kind: 'column' }, { kind: 'sankey' }])).toBe(7);
    expect(weightLabel(1)).toBe('1 ponto');
    expect(weightLabel(4)).toBe('4 pontos');
  });

  // triste
  it('gives every kind a weight between 1 and 4, and an empty board weighs nothing', () => {
    for (const kind of WIDGET_KINDS) {
      expect(WIDGET_WEIGHTS[kind]).toBeGreaterThanOrEqual(1);
      expect(WIDGET_WEIGHTS[kind]).toBeLessThanOrEqual(4);
    }
    expect(boardWeight([])).toBe(0);
    expect(MAX_WIDGETS).toBeGreaterThanOrEqual(MAX_BOARD_WEIGHT);
  });
});

describe('filter tree', () => {
  const tree: FilterGroup = {
    combinator: 'and',
    rules: [
      { field: 'status', operator: 'in' as const, value: ['doing'] },
      {
        combinator: 'or' as const,
        rules: [{ field: 'createdBy', operator: '=' as const, value: 'u-ana' }],
      },
    ],
  };

  // feliz
  it('counts levels and rules and accepts the source fields', () => {
    expect(filterSize(tree)).toEqual({ depth: 2, rules: 2 });
    expect(filterProblems('tasks', tree)).toEqual([]);
    expect(
      saveFilterSchema.safeParse({
        name: 'Minhas em andamento',
        source: 'tasks',
        scope: 'personal',
        tree,
      }).success,
    ).toBe(true);
  });

  // triste
  it('rejects fields from another source and trees that are too deep', () => {
    expect(filterProblems('activity', tree)).toContain(
      '"status" não é um campo de Movimento nas tarefas.',
    );
    let deep: FilterGroup = tree;
    for (let level = 0; level < 5; level += 1) deep = { combinator: 'and', rules: [deep] };
    expect(filterProblems('tasks', deep)[0]).toMatch(/níveis/);
  });
});

describe('agenda window', () => {
  const AGENDA = { ...WIDGET, kind: 'agenda', groupBy: 'createdDay' };

  // feliz
  it('accepts a day agenda with one of the offered counts', () => {
    const parsed = widgetSchema.safeParse({
      ...AGENDA,
      window: { mode: 'relative', unit: 'month', count: 2, direction: 'next' },
    });

    expect(parsed.success).toBe(true);
  });

  // feliz
  it('counts the window from the start of today, this week or this month', () => {
    const today = '2026-11-18';
    expect(
      windowRange({ mode: 'relative', unit: 'month', count: 2, direction: 'next' }, today),
    ).toEqual({ from: '2026-11-01', to: '2026-12-31' });
    expect(
      windowRange({ mode: 'relative', unit: 'week', count: 1, direction: 'next' }, today),
    ).toEqual({ from: '2026-11-15', to: '2026-11-21' });
    expect(
      windowRange({ mode: 'relative', unit: 'day', count: 7, direction: 'last' }, today),
    ).toEqual({ from: '2026-11-12', to: '2026-11-18' });
    expect(windowLabel({ mode: 'relative', unit: 'week', count: 2, direction: 'next' })).toBe(
      'Próximas 2 semanas',
    );
  });

  // triste
  it('rejects over 90 days, unlisted counts, an agenda without window or by month', () => {
    const tooLong = widgetWindowSchema.safeParse({
      mode: 'custom',
      from: '2026-01-01',
      to: '2026-12-31',
    });
    const odd = widgetWindowSchema.safeParse({
      mode: 'relative',
      unit: 'day',
      count: 365,
      direction: 'next',
    });

    expect(tooLong.success).toBe(false);
    expect(tooLong.error?.issues[0]?.message).toMatch(/90 dias/);
    expect(odd.success).toBe(false);
    expect(widgetSchema.safeParse(AGENDA).success).toBe(false);
    expect(
      widgetSchema.safeParse({ ...AGENDA, groupBy: 'createdMonth', window: DEFAULT_WINDOW })
        .success,
    ).toBe(false);
  });

  // triste
  it('rejects inverted dates', () => {
    expect(
      widgetWindowSchema.safeParse({ mode: 'custom', from: '2026-11-30', to: '2026-11-01' })
        .success,
    ).toBe(false);
  });
});

describe('board field filters', () => {
  // feliz
  it('turns the chosen values into field matches only where the source has the field', () => {
    const values = { ...EMPTY_BOARD_FILTER_VALUES, taskStatus: 'done' };

    expect(boardMatches(values, 'tasks')).toEqual([{ field: 'status', value: 'done' }]);
    expect(boardMatches(values, 'activity')).toEqual([]);
    expect(boardMatchGroup(boardMatches(values, 'tasks'))).toEqual({
      combinator: 'and',
      rules: [{ field: 'status', operator: '=', value: 'done' }],
    });
  });

  // feliz
  it('applies each kind only to its sources', () => {
    expect(boardFilterApplies('taskStatus', 'tasks')).toBe(true);
    expect(boardFilterApplies('taskStatus', 'activity')).toBe(false);
    expect(boardFilterApplies('period', 'activity')).toBe(true);
    expect(boardFilterApplies('person', 'activity')).toBe(true);
  });

  // triste
  it('adds nothing without a chosen value', () => {
    expect(boardMatches(EMPTY_BOARD_FILTER_VALUES, 'tasks')).toEqual([]);
    expect(boardMatchGroup([])).toBeNull();
  });

  // triste
  it('refuses a widget query with a blank match value', () => {
    const query = {
      source: 'tasks',
      groupBy: null,
      filterId: null,
      matches: [{ field: 'status', value: '  ' }],
    };

    expect(widgetQuerySchema.safeParse(query).success).toBe(false);
    expect(widgetQuerySchema.parse({ ...query, matches: undefined }).matches).toEqual([]);
  });
});
