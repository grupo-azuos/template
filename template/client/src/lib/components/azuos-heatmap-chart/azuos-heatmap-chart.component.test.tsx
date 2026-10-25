import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { AzuosHeatmapChart, cellsOf } from './azuos-heatmap-chart.component';

const DATA = {
  rows: ['Leyla', 'Gabryel'],
  columns: ['Resolvido', 'Parado'],
  cells: [
    { row: 'Leyla', column: 'Resolvido', value: 9 },
    { row: 'Gabryel', column: 'Parado', value: 4 },
  ],
  seriesLabel: 'Alvarás',
};

describe('cellsOf', () => {
  // feliz
  it('fills every row and column, with zero where no cell came', () => {
    expect(cellsOf(DATA)).toEqual([
      { row: 'Leyla', column: 'Resolvido', value: 9 },
      { row: 'Leyla', column: 'Parado', value: 0 },
      { row: 'Gabryel', column: 'Resolvido', value: 0 },
      { row: 'Gabryel', column: 'Parado', value: 4 },
    ]);
  });
});

describe('AzuosHeatmapChart', () => {
  // feliz
  /* Uma linha por pessoa: a equipe inteira cabe, rolando, em vez de achatar cada linha. */
  it('grows the drawing with the rows and scrolls inside the box', () => {
    render(<AzuosHeatmapChart data={DATA} ui={{ heightClass: 'h-40' }} />);

    expect(screen.getByRole('img')).toHaveStyle({ height: `${2 * 34 + 36}px` });
  });

  // triste
  it('says there is no data instead of drawing an empty grid', () => {
    render(<AzuosHeatmapChart data={{ ...DATA, cells: [] }} ui={{ emptyLabel: 'Sem dados' }} />);

    expect(screen.getByText('Sem dados')).toBeInTheDocument();
  });
});
