import { ForbiddenException, UnprocessableEntityException } from '@nestjs/common';
import { widgetQuerySchema } from '@template/shared/schemas/dashboard-board.schema';
import { describe, expect, it, vi } from 'vitest';

import { type RequestUser } from '../../../lib/auth/request-user.type';
import { type SavedFilterRow } from '../../../lib/db/schema/dashboard-boards.schema';
import { type UserDirectoryService } from '../../users/service/user-directory.service';
import { type DashboardBoardsRepository } from '../repository/dashboard-boards.repository';
import { canEdit, canView, DashboardBoardsService } from './dashboard-boards.service';

const ana: RequestUser = { id: 'u-ana', email: 'ana@x', name: 'Ana', role: 'user' };
const gestora: RequestUser = { ...ana, id: 'u-bia', email: 'bia@x', name: 'Bia', role: 'manager' };

const FILTER: SavedFilterRow = {
  id: '0196f3e8-0000-7000-8000-00000000f001',
  name: 'Da Bia',
  description: null,
  source: 'tasks',
  scope: 'personal',
  tree: { combinator: 'and', rules: [{ field: 'createdBy', operator: '=', value: 'u-bia' }] },
  ownerId: 'u-ana',
  createdAt: new Date(),
  updatedAt: new Date(),
  archivedAt: null,
  archivedBy: null,
};

function makeService(repository: Partial<DashboardBoardsRepository>) {
  const people = {
    list: vi.fn().mockResolvedValue({
      people: [{ id: 'u-bia', name: 'Bia', email: 'bia@x', avatarUrl: null }],
      isConnected: true,
    }),
  };

  return new DashboardBoardsService(
    repository as DashboardBoardsRepository,
    people as unknown as UserDirectoryService,
  );
}

const counted = { total: 1, grandTotal: 2, groups: [{ key: 'bia@x', value: 1 }], cells: [] };

describe('who sees and edits a board', () => {
  // feliz
  it('lets everyone see the team board and the manager edit it', () => {
    expect(canView(ana, 'team')).toBe(true);
    expect(canEdit(ana, 'team')).toBe(false);
    expect(canEdit(gestora, 'team')).toBe(true);
    expect(canEdit(ana, 'personal')).toBe(true);
  });

  // triste
  it('keeps the manager board away from a user', async () => {
    const service = makeService({ findBoard: vi.fn() });

    await expect(service.board(ana, 'manager')).rejects.toThrow(ForbiddenException);
    await expect(
      service.saveBoard(ana, 'team', { widgets: [], layout: [], filters: [] }),
    ).rejects.toThrow(ForbiddenException);
  });
});

describe('the weight quota of a board', () => {
  /* Cada bloco cruzado vale 4 pontos: sete são 28, e passam da cota de 24. */
  const heavy = (count: number) => {
    const widgets = Array.from({ length: count }, (_, index) => ({
      id: `h${index}`,
      kind: 'heatmap' as const,
      title: 'Cruzado',
      source: 'tasks' as const,
      groupBy: 'status',
      splitBy: 'createdBy',
      filterId: null,
      onlyMine: false,
      period: 'all' as const,
      window: null,
    }));

    return {
      widgets,
      layout: widgets.map((widget, index) => ({ i: widget.id, x: 0, y: index * 2, w: 2, h: 2 })),
      filters: [],
    };
  };
  const saved = {
    scope: 'team',
    widgets: [],
    layout: [],
    filters: [],
    updatedAt: new Date(),
    updatedBy: gestora.id,
  };

  // triste
  it('refuses a board that goes past the weight quota', async () => {
    const saveBoard = vi.fn();
    const service = makeService({ findBoard: vi.fn().mockResolvedValue(null), saveBoard });

    await expect(service.saveBoard(gestora, 'team', heavy(7))).rejects.toThrow(
      'O painel passa da cota de 24 pontos (28). Tire ou troque um bloco.',
    );
    expect(saveBoard).not.toHaveBeenCalled();
  });

  // feliz
  it('saves a board right at the quota', async () => {
    const saveBoard = vi.fn().mockResolvedValue(saved);
    const service = makeService({ findBoard: vi.fn().mockResolvedValue(null), saveBoard });

    await expect(service.saveBoard(gestora, 'team', heavy(6))).resolves.toBeDefined();
  });

  // feliz
  it('still saves a board that was already past the quota, as long as it does not grow', async () => {
    const saveBoard = vi.fn().mockResolvedValue(saved);
    const findBoard = vi.fn().mockResolvedValue({ ...saved, widgets: heavy(7).widgets });
    const service = makeService({ findBoard, saveBoard });

    await expect(service.saveBoard(gestora, 'team', heavy(7))).resolves.toBeDefined();
    await expect(service.saveBoard(gestora, 'team', heavy(8))).rejects.toThrow(
      UnprocessableEntityException,
    );
  });
});

describe('DashboardBoardsService.data', () => {
  // feliz
  it('turns the saved person id into what the source keeps and labels by name', async () => {
    const countBy = vi.fn().mockResolvedValue(counted);
    const service = makeService({ findFilter: vi.fn().mockResolvedValue(FILTER), countBy });

    const data = await service.data(
      ana,
      widgetQuerySchema.parse({ source: 'tasks', groupBy: 'createdBy', filterId: FILTER.id }),
    );

    const [, query] = countBy.mock.calls[0]!;
    expect(query.tree.rules[0].value).toBe('bia@x');
    expect(data.series[0]).toMatchObject({ key: 'bia@x', label: 'Bia' });
  });

  // triste
  it('refuses a filter from another source and a grouping the source does not have', async () => {
    const service = makeService({
      findFilter: vi.fn().mockResolvedValue({ ...FILTER, source: 'activity' }),
      countBy: vi.fn().mockResolvedValue(counted),
    });

    await expect(
      service.data(ana, widgetQuerySchema.parse({ source: 'tasks', groupBy: null, filterId: FILTER.id })),
    ).rejects.toThrow(UnprocessableEntityException);
    await expect(
      service.data(ana, widgetQuerySchema.parse({ source: 'tasks', groupBy: 'cor', filterId: null })),
    ).rejects.toThrow(UnprocessableEntityException);
  });
});

describe('saved filters', () => {
  // triste
  it('does not let someone change a filter that belongs to another person', async () => {
    const service = makeService({
      findFilter: vi.fn().mockResolvedValue({ ...FILTER, ownerId: 'u-caio', scope: 'shared' }),
    });

    await expect(service.setFilterArchived(ana, FILTER.id, true)).rejects.toThrow(
      ForbiddenException,
    );
  });
});
