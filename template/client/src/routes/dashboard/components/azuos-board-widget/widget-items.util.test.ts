import { describe, expect, it } from 'vitest';

import { cellItemOf, itemOfLabel, sankeyItemOf, timeItemOf } from './widget-items.util';

const SERIES = [{ key: 'ana@x', label: 'Ana Souza', value: 3 }];
const CELLS = [
  { row: 'ana@x', rowLabel: 'Ana Souza', column: 'done', columnLabel: 'Concluída', value: 2 },
];

describe('the item of a click', () => {
  // feliz
  it('turns the drawn label back into the key the server grouped', () => {
    expect(itemOfLabel(SERIES, 'Ana Souza')).toEqual({ key: 'ana@x', label: 'Ana Souza' });
    expect(cellItemOf(CELLS, 'Ana Souza', 'Concluída')).toEqual({
      key: 'ana@x',
      label: 'Ana Souza',
      key2: 'done',
      label2: 'Concluída',
    });
    expect(sankeyItemOf(CELLS, 'b:done')).toEqual({ key: null, key2: 'done', label2: 'Concluída' });
  });

  // feliz
  it('turns the clicked instant of the area chart back into the day or the month', () => {
    const months = [{ key: '2026-11', label: 'nov/2026', value: 4 }];

    expect(timeItemOf(months, '2026-11-01T12:00:00.000Z')).toEqual({
      key: '2026-11',
      label: 'nov/2026',
    });
  });

  // triste
  it('keeps the label as the key when it is not in the series, and ignores an unknown node', () => {
    expect(itemOfLabel(SERIES, 'Sem nome')).toEqual({ key: 'Sem nome', label: 'Sem nome' });
    expect(sankeyItemOf(CELLS, 'x:nada')).toBeNull();
    expect(timeItemOf(SERIES, '2026-11-01T12:00:00.000Z')).toBeNull();
  });
});
