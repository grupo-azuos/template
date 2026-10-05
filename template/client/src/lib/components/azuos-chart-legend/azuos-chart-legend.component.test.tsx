import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { AzuosChartLegend } from './azuos-chart-legend.component';

const SERIES = [
  { key: 'done', label: 'Concluídas', color: 'var(--chart-2)' },
  { key: 'open', label: 'Abertas', color: 'var(--chart-1)' },
];

describe('AzuosChartLegend', () => {
  // feliz
  /* A cor nunca é o único jeito de saber qual série é qual: nenhuma paleta categórica com muitas
     séries passa no teste de daltonismo, então o nome vem ESCRITO. */
  it('writes the name of every series next to its colour', () => {
    render(<AzuosChartLegend data={{ series: SERIES }} />);

    expect(screen.getByText('Concluídas')).toBeInTheDocument();
    expect(screen.getByText('Abertas')).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
  });

  // triste
  /* Legenda de uma série é ruído: o título do bloco já diz o que está desenhado. */
  it('draws nothing for a single series', () => {
    const { container } = render(<AzuosChartLegend data={{ series: [SERIES[0]!] }} />);

    expect(container).toBeEmptyDOMElement();
  });

  it('draws nothing when there is no series', () => {
    const { container } = render(<AzuosChartLegend data={{ series: [] }} />);

    expect(container).toBeEmptyDOMElement();
  });
});
