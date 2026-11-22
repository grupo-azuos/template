import { describe, expect, it } from 'vitest';

import { EMPTY_BOARD_FILTER_VALUES } from '@template/shared/schemas/dashboard-board.schema';

import { widgetFixture } from './dashboard-fixture.util';
import { boardLinkOf, drillScreenOf } from './board-link.util';

describe('boardLinkOf', () => {
  // feliz
  it('opens the list of the source with the question of the block and the clicked item', () => {
    const widget = widgetFixture({ source: 'tasks', groupBy: 'status', title: 'Por status' });
    const link = boardLinkOf(widget, EMPTY_BOARD_FILTER_VALUES, {
      key: 'done',
      label: 'Concluída',
    });

    expect(link?.to).toBe('/tasks');
    expect(link?.search.drill).toMatchObject({
      source: 'tasks',
      groupBy: 'status',
      key: 'done',
      label: 'Concluída',
      title: 'Por status',
    });
    expect(drillScreenOf('activity')).toBe('/history');
  });

  // triste
  it('promises no click when the block was built read-only', () => {
    const widget = { ...widgetFixture({ source: 'tasks' }), isClickable: false };

    expect(boardLinkOf(widget, EMPTY_BOARD_FILTER_VALUES, { key: 'done' })).toBeNull();
  });
});
