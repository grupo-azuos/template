import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { AzuosStackedBarChart, totalOf } from './azuos-stacked-bar-chart.component';

const SERIES = [
  { key: 'done', label: 'Entregue', color: '#047857' },
  { key: 'pending', label: 'Pendente', color: '#b45309' },
];
const CATEGORIES = [
  { label: 'BOMBEIRO', values: { done: 6, pending: 3 } },
  { label: 'SANITÁRIO', values: { done: 2, pending: 4 } },
];

describe('AzuosStackedBarChart', () => {
  // feliz
  it('sums each row for the number at its end', () => {
    expect(totalOf(CATEGORIES[0]!)).toBe(9);
  });

  /* As partes vêm com o nome ESCRITO na legenda, não só pela cor. */
  it('names every part in the legend', () => {
    render(<AzuosStackedBarChart data={{ categories: CATEGORIES, series: SERIES, seriesLabel: 'Tipos' }} />);

    expect(screen.getByText('Entregue')).toBeInTheDocument();
    expect(screen.getByText('Pendente')).toBeInTheDocument();
  });

  // triste
  it('says there is no data instead of drawing empty rows', () => {
    render(
      <AzuosStackedBarChart
        data={{ categories: [], series: SERIES, seriesLabel: 'Tipos' }}
        ui={{ emptyLabel: 'Nenhum tipo' }}
      />,
    );

    expect(screen.getByText('Nenhum tipo')).toBeInTheDocument();
  });
});
