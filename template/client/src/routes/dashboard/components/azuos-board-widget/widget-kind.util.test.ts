import { describe, expect, it } from 'vitest';

import { WIDGET_KINDS } from '@template/shared/schemas/dashboard-board.schema';

import {
  bottomPlace,
  defaultSizeOf,
  MAIN_KINDS,
  OTHER_KINDS,
  suggestedTitle,
} from './widget-kind.util';

describe('widget kinds', () => {
  // feliz
  it('splits every kind into the two groups, without repeats', () => {
    const all = [...MAIN_KINDS, ...OTHER_KINDS];

    expect(new Set(all).size).toBe(all.length);
    expect([...all].sort()).toEqual([...WIDGET_KINDS].sort());
    expect(MAIN_KINDS.length).toBeLessThanOrEqual(7);
  });

  // feliz
  it('gives each kind its own size and places a click at the bottom', () => {
    expect(defaultSizeOf('hero')).toEqual({ w: 4, h: 2 });
    expect(defaultSizeOf('radial')).toEqual({ w: 1, h: 2 });
    expect(
      bottomPlace(
        [
          { y: 0, h: 2 },
          { y: 2, h: 3 },
        ],
        'column',
      ),
    ).toEqual({
      x: 0,
      y: 5,
      w: 2,
      h: 2,
    });
  });

  // feliz
  it('suggests a title that says what the block counts', () => {
    expect(suggestedTitle('column', 'tarefas', 'Status')).toBe('Tarefas por status');
    expect(suggestedTitle('hero', 'tarefas', 'Status')).toBe('Destaque');
  });

  // triste
  it('still gives a place and a title for an empty board and an ungrouped block', () => {
    expect(bottomPlace([], 'stats')).toEqual({ x: 0, y: 0, w: 4, h: 1 });
    expect(suggestedTitle('radial', 'contratos', null)).toBe('Contratos');
  });
});
