import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { type ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  type Board,
  DEFAULT_WINDOW,
  EMPTY_BOARD_FILTER_VALUES,
  type Widget,
} from '@template/shared/schemas/dashboard-board.schema';
import { type UserRole } from '@template/shared/schemas/user.schema';

import { MOCK_SESSION_USER, mockAuth } from '../auth/mock-user';
import { widgetFixture } from '../utils/dashboard-fixture.util';
import {
  activeValues,
  normalizeLayout,
  queryOf,
  upsertWidget,
  useDashboardBoardModel,
  visibleScopes,
} from './use-dashboard-board.model';

vi.mock('../api/dashboard-boards.api', () => ({
  dashboardBoardsApi: {
    board: vi.fn(),
    saveBoard: vi.fn(),
    data: vi.fn(),
    streamUrl: vi.fn(() => 'http://api.test/dashboard-boards/stream'),
  },
}));

vi.mock('../api/users.api', () => ({
  usersApi: { list: vi.fn(async () => ({ people: [], isConnected: false })) },
}));

const { dashboardBoardsApi } = await import('../api/dashboard-boards.api');

/** Um `EventSource` de mentira: guarda quem escuta, e o teste dispara o evento. */
class FakeEventSource {
  static last: FakeEventSource | null = null;
  readonly listeners = new Map<string, () => void>();
  closed = false;
  constructor(readonly url: string) {
    FakeEventSource.last = this;
  }
  addEventListener(type: string, listener: () => void) {
    this.listeners.set(type, listener);
  }
  close() {
    this.closed = true;
  }
}
vi.stubGlobal('EventSource', FakeEventSource);

const LIST: Widget = widgetFixture({
  id: 'a',
  kind: 'list',
  title: 'Por quem cadastrou',
  groupBy: 'createdBy',
});
const BOARD: Board = {
  scope: 'team',
  widgets: [LIST],
  layout: [{ i: 'a', x: 0, y: 0, w: 4, h: 2 }],
  filters: [{ id: 'periodo', kind: 'period', label: 'Período' }],
  canEdit: true,
  updatedAt: null,
  updatedBy: null,
};

/** A pessoa logada no teste, com o papel pedido — a sessão do sistema passa a devolvê-la. */
function wrapperFor(role: UserRole = 'admin') {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  vi.spyOn(mockAuth, 'getUser').mockReturnValue({ ...MOCK_SESSION_USER, role });

  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  };
}

describe('useDashboardBoardModel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(dashboardBoardsApi.board).mockImplementation(
      async (scope) => ({ data: { board: { ...BOARD, scope } }, links: {} }) as never,
    );
    vi.mocked(dashboardBoardsApi.data).mockResolvedValue({
      data: { result: { total: 3, series: [{ key: 'ana', label: 'Ana', value: 3 }] } },
      links: {},
    } as never);
  });

  // feliz
  it('opens the team board with the numbers of each block', async () => {
    const { result } = renderHook(useDashboardBoardModel, { wrapper: wrapperFor() });

    await waitFor(() => expect(result.current.data.results.a?.data?.total).toBe(3));
    expect(result.current.data.widgets).toEqual([LIST]);
    expect(result.current.state.canEdit).toBe(true);
    expect(dashboardBoardsApi.data).toHaveBeenCalledWith(queryOf(LIST));
  });

  // feliz
  it('rereads the blocks on a live notice and closes the stream on unmount', async () => {
    const { result, unmount } = renderHook(useDashboardBoardModel, { wrapper: wrapperFor() });
    await waitFor(() => expect(result.current.data.results.a?.data?.total).toBe(3));
    const calls = vi.mocked(dashboardBoardsApi.data).mock.calls.length;

    act(() => FakeEventSource.last?.listeners.get('dashboard')?.());

    await waitFor(() =>
      expect(vi.mocked(dashboardBoardsApi.data).mock.calls.length).toBeGreaterThan(calls),
    );
    expect(FakeEventSource.last?.url).toBe('http://api.test/dashboard-boards/stream');
    unmount();
    expect(FakeEventSource.last?.closed).toBe(true);
  });

  // feliz
  it('edits a draft, adds new blocks at the bottom and saves everything at once', async () => {
    vi.mocked(dashboardBoardsApi.saveBoard).mockImplementation(
      async (scope, body) =>
        ({
          data: { board: { ...BOARD, ...body, scope, updatedAt: '2026-11-07T12:00:00.000Z' } },
          links: {},
        }) as never,
    );
    const { result } = renderHook(useDashboardBoardModel, { wrapper: wrapperFor() });
    await waitFor(() => expect(result.current.state.isLoading).toBe(false));

    act(() => result.current.actions.onStartEdit());
    act(() => result.current.actions.onNewWidget());
    const fresh = {
      ...(result.current.data.editing?.widget as Widget),
      title: 'Por status',
      groupBy: 'status',
    };
    act(() => result.current.actions.onSubmitWidget(fresh));
    expect(result.current.data.layout[1]).toEqual({ i: fresh.id, x: 0, y: 2, w: 2, h: 2 });

    act(() => result.current.actions.onSave());
    await waitFor(() => expect(result.current.state.isEditing).toBe(false));
    expect(dashboardBoardsApi.saveBoard).toHaveBeenCalledWith('team', {
      widgets: [LIST, fresh],
      layout: [BOARD.layout[0], { i: fresh.id, x: 0, y: 2, w: 2, h: 2 }],
      filters: BOARD.filters,
    });
    expect(result.current.data.updatedAt).toBe('2026-11-07T12:00:00.000Z');
  });

  // feliz
  it('creates the block in the chosen kind, on the first source, and previews the draft', async () => {
    const { result } = renderHook(useDashboardBoardModel, { wrapper: wrapperFor() });
    await waitFor(() => expect(result.current.state.isLoading).toBe(false));

    act(() => result.current.actions.onStartEdit());
    act(() => result.current.actions.onNewWidget('donut'));
    const fresh = result.current.data.editing?.widget as Widget;
    expect(fresh).toMatchObject({ kind: 'donut', source: 'tasks', groupBy: 'status' });

    act(() => result.current.actions.onPreviewChange({ ...fresh, groupBy: 'createdBy' }));
    await waitFor(() => expect(result.current.data.preview?.data?.total).toBe(3));
    expect(dashboardBoardsApi.data).toHaveBeenCalledWith(
      queryOf({ ...fresh, groupBy: 'createdBy' }),
    );
  });

  // triste
  it('has no preview without an open block', async () => {
    const { result } = renderHook(useDashboardBoardModel, { wrapper: wrapperFor() });
    await waitFor(() => expect(result.current.state.isLoading).toBe(false));

    expect(result.current.data.preview).toBeNull();
  });

  // triste
  it('discards the draft on cancel and removes a block together with its place', async () => {
    const { result } = renderHook(useDashboardBoardModel, { wrapper: wrapperFor() });
    await waitFor(() => expect(result.current.state.isLoading).toBe(false));

    act(() => result.current.actions.onStartEdit());
    act(() => result.current.actions.onRemoveWidget('a'));
    expect(result.current.data.widgets).toEqual([]);
    expect(result.current.data.layout).toEqual([]);
    act(() => result.current.actions.onCancelEdit());
    expect(result.current.data.widgets).toEqual([LIST]);
    expect(dashboardBoardsApi.saveBoard).not.toHaveBeenCalled();
  });

  // feliz
  it('applies the chosen board period to every block, and saves added and removed filters', async () => {
    const { result } = renderHook(useDashboardBoardModel, { wrapper: wrapperFor() });
    await waitFor(() => expect(result.current.state.isLoading).toBe(false));
    const period = { mode: 'relative', direction: 'last', count: 7, unit: 'day' } as const;

    act(() => result.current.actions.onFilterValueChange({ period, person: 'u-ana' }));
    await waitFor(() =>
      expect(dashboardBoardsApi.data).toHaveBeenCalledWith(
        queryOf(LIST, { ...EMPTY_BOARD_FILTER_VALUES, period }),
      ),
    );
    expect(result.current.data.filterValues).toEqual({ ...EMPTY_BOARD_FILTER_VALUES, period });

    act(() => result.current.actions.onStartEdit());
    act(() => result.current.actions.onAddBoardFilter('person'));
    act(() => result.current.actions.onAddBoardFilter('person'));
    expect(result.current.data.boardFilters.map((filter) => filter.kind)).toEqual([
      'period',
      'person',
    ]);
    expect(result.current.data.filterValues.person).toBe('u-ana');
    act(() => result.current.actions.onRemoveBoardFilter('periodo'));
    expect(result.current.data.filterValues.period).toBeNull();
  });

  // triste
  it('hides the manager board from a user, even when forced', async () => {
    const { result } = renderHook(useDashboardBoardModel, { wrapper: wrapperFor('user') });

    expect(result.current.data.scopes.map((scope) => scope.value)).toEqual(['team', 'personal']);
    act(() => result.current.actions.onScopeChange('manager'));
    expect(result.current.data.scope).toBe('team');
  });
});

describe('board layout', () => {
  // feliz
  it('lists the boards according to being a manager', () => {
    expect(visibleScopes(true).map((scope) => scope.label)).toEqual([
      'Equipe',
      'Gestor',
      'Pessoal',
    ]);
  });

  // feliz
  it('replaces only the content of an existing block, keeping its place', () => {
    const next = upsertWidget(
      { widgets: [LIST], layout: BOARD.layout, filters: [] },
      { ...LIST, title: 'Outro' },
    );

    expect(next.widgets[0]?.title).toBe('Outro');
    expect(next.layout).toEqual(BOARD.layout);
  });

  // feliz
  it('places a dropped block where it landed, and an unplaced one at the bottom', () => {
    const fresh = widgetFixture({ id: 'novo' });
    const dropped = upsertWidget({ widgets: [], layout: [], filters: [] }, fresh, {
      x: 1,
      y: 3,
      w: 2,
      h: 3,
    });
    const appended = upsertWidget({ widgets: [LIST], layout: BOARD.layout, filters: [] }, fresh);

    expect(dropped.layout).toEqual([{ i: 'novo', x: 1, y: 3, w: 2, h: 3 }]);
    expect(appended.layout.at(-1)).toMatchObject({ i: 'novo', x: 0, w: 2, h: 2 });
  });

  // feliz
  it('builds the block query from the whole scope, not the title', () => {
    expect(
      queryOf(widgetFixture({ onlyMine: true, period: 'today', splitBy: 'createdBy', title: 'X' })),
    ).toEqual({
      source: 'tasks',
      groupBy: 'status',
      splitBy: 'createdBy',
      filterId: null,
      onlyMine: true,
      period: 'today',
      window: null,
      person: null,
      boardPeriod: null,
      matches: [],
    });
  });

  // triste
  it('keeps the chosen person on a source with a person, and drops the values of absent filters', () => {
    const values = { ...EMPTY_BOARD_FILTER_VALUES, person: 'u-ana' };

    expect(queryOf(widgetFixture({ source: 'activity', groupBy: 'actor' }), values).person).toBe(
      'u-ana',
    );
    expect(
      activeValues([], { ...EMPTY_BOARD_FILTER_VALUES, person: 'u-ana', period: DEFAULT_WINDOW }),
    ).toEqual(EMPTY_BOARD_FILTER_VALUES);
  });

  // feliz
  it('sends a field filter only to blocks whose source has the field', () => {
    const values = { ...EMPTY_BOARD_FILTER_VALUES, taskStatus: 'done' };

    expect(queryOf(widgetFixture(), values).matches).toEqual([{ field: 'status', value: 'done' }]);
    expect(
      queryOf(widgetFixture({ source: 'activity', groupBy: 'actor' }), values).matches,
    ).toEqual([]);
  });

  // triste
  it('drops the value of a field filter the board no longer has', () => {
    const chosen = { ...EMPTY_BOARD_FILTER_VALUES, taskStatus: 'done', person: 'u-ana' };

    expect(
      activeValues([{ id: 'taskStatus', kind: 'taskStatus', label: 'Status' }], chosen),
    ).toEqual({ ...EMPTY_BOARD_FILTER_VALUES, taskStatus: 'done' });
  });

  // triste
  it('never leaves a block 1x1 or past the 4-column edge', () => {
    expect(normalizeLayout([{ i: 'a', x: 3, y: 0, w: 1, h: 1 }])).toEqual([
      { i: 'a', x: 3, y: 0, w: 1, h: 2 },
    ]);
    expect(normalizeLayout([{ i: 'a', x: 3, y: 0, w: 3, h: 1 }])).toEqual([
      { i: 'a', x: 1, y: 0, w: 3, h: 1 },
    ]);
  });
});
