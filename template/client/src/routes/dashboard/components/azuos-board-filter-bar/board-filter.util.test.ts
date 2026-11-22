import { describe, expect, it } from 'vitest';

import {
  EMPTY_BOARD_FILTER_VALUES,
  ME_VALUE,
} from '@template/shared/schemas/dashboard-board.schema';

import {
  activeSummary,
  clampRange,
  fieldFilterOptions,
  moveInList,
  optionCounts,
  personOptions,
  placesInOrder,
  presetOf,
  toolbarDisplayOf,
  toolbarDisplaysOf,
  windowOfPreset,
} from './board-filter.util';

const PEOPLE = [
  { id: 'u-ana', name: 'Ana', photo: null },
  { id: 'u-bia', name: 'Bia', photo: '/avatars/bia.png' },
];

describe('board filter options', () => {
  // feliz
  /* O filtro de pessoa é sempre com o rosto, e guarda o id. */
  it('gives each person the photo and keeps the id as the value', () => {
    expect(personOptions(PEOPLE)).toEqual([
      { value: 'u-ana', label: 'Ana', personName: 'Ana', avatarUrl: null },
      { value: 'u-bia', label: 'Bia', personName: 'Bia', avatarUrl: '/avatars/bia.png' },
    ]);
  });

  // feliz
  it('labels the values of a field filter in Portuguese', () => {
    expect(fieldFilterOptions('taskStatus')).toContainEqual({ value: 'done', label: 'Concluída' });
  });

  // feliz
  it('counts each option, with the total on "Todos"', () => {
    const counts = optionCounts({
      total: 30,
      isLoading: false,
      series: [{ key: 'done', label: 'Concluída', value: 20 }],
    });

    expect(counts.get('')).toBe(30);
    expect(counts.get('done')).toBe(20);
  });

  // triste
  it('counts zero while the count has not arrived', () => {
    expect(optionCounts(null).get('')).toBe(0);
  });

  // feliz
  it('writes what is chosen the way the person read it', () => {
    expect(
      activeSummary({
        filters: [
          { id: 'pessoa', kind: 'person', label: 'Responsável' },
          { id: 'status', kind: 'taskStatus', label: 'Status' },
        ],
        values: { ...EMPTY_BOARD_FILTER_VALUES, person: 'u-bia', taskStatus: 'done' },
        people: PEOPLE,
      }),
    ).toEqual([
      { label: 'Responsável', value: 'Bia' },
      { label: 'Status', value: 'Concluída' },
    ]);
  });

  // triste
  it('says "Eu" for the viewer, and the id of someone who left the directory', () => {
    const values = { ...EMPTY_BOARD_FILTER_VALUES, person: ME_VALUE };
    const filters = [{ id: 'pessoa', kind: 'person' as const, label: 'Responsável' }];

    expect(activeSummary({ filters, values })[0]?.value).toBe('Eu');
    expect(activeSummary({ filters, values: { ...values, person: 'u-x' } })[0]?.value).toBe('u-x');
  });
});

describe('the toolbar designs', () => {
  // feliz
  it('offers the list, the search and the cards on the toolbar', () => {
    expect(toolbarDisplaysOf('taskStatus')).toEqual(['select', 'search', 'cards']);
    expect(toolbarDisplaysOf('person')).toEqual(['search', 'cards']);
    expect(toolbarDisplaysOf('period')).toEqual(['select']);
  });

  // triste
  it('falls a board saved with tags or faces back to the list, or to the search for people', () => {
    expect(toolbarDisplayOf({ kind: 'taskStatus', display: 'chips' })).toBe('select');
    expect(toolbarDisplayOf({ kind: 'person', display: 'avatars' })).toBe('search');
  });
});

describe('the toolbar order', () => {
  // feliz
  it('moves a filter and writes the order as the reading order of the grid', () => {
    const ids = moveInList(['a', 'b', 'c'], 2, 0);

    expect(ids).toEqual(['c', 'a', 'b']);
    expect(placesInOrder(ids, 4)[0]).toEqual({ id: 'c', place: { x: 0, y: 0, w: 1, h: 1 } });
    expect(placesInOrder(['a', 'b', 'c', 'd', 'e'], 4)[4]?.place).toEqual({
      x: 0,
      y: 1,
      w: 1,
      h: 1,
    });
  });

  // triste
  it('keeps the order when the move goes outside the list', () => {
    expect(moveInList(['a', 'b'], 0, 5)).toEqual(['a', 'b']);
  });
});

describe('board period presets', () => {
  // feliz
  it('maps windows to presets and back', () => {
    expect(presetOf(windowOfPreset('last-7-day', '2026-11-08'))).toBe('last-7-day');
    expect(windowOfPreset('each', '2026-11-08')).toBeNull();
  });

  // triste
  it('pulls a too-long or reversed range back inside 90 days', () => {
    expect(clampRange('2026-01-01', '2026-12-31')).toEqual({
      from: '2026-01-01',
      to: '2026-03-31',
    });
    expect(clampRange('2026-03-10', '2026-03-01')).toEqual({
      from: '2026-03-01',
      to: '2026-03-10',
    });
  });
});
