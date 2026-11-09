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
