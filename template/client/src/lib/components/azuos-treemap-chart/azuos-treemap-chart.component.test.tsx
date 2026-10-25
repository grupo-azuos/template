import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { AzuosTreemapChart, OTHERS_ID, withOthers } from './azuos-treemap-chart.component';

const SLICES = [
  { label: 'Anápolis', value: 541 },
  { label: 'Goiânia', value: 3357 },
  { label: 'Trindade', value: 30 },
  { label: 'Inhumas', value: 12 },
];

describe('withOthers', () => {
  // feliz
  it('keeps the biggest ones, biggest first, and sums the rest into "Outros"', () => {
    expect(withOthers(SLICES, 2)).toEqual([
      { id: 'Goiânia', label: 'Goiânia', value: 3357 },
      { id: 'Anápolis', label: 'Anápolis', value: 541 },
      { id: OTHERS_ID, label: 'Outros (2)', value: 42 },
    ]);
  });

  // triste
  it('draws no "Outros" block when everything fits', () => {
    expect(withOthers(SLICES, 10).some((slice) => slice.id === OTHERS_ID)).toBe(false);
  });
});

describe('AzuosTreemapChart', () => {
  // feliz
  it('gives every block to a screen reader', () => {
    render(<AzuosTreemapChart data={{ slices: SLICES, seriesLabel: 'Alvarás' }} />);

    expect(screen.getByText('Goiânia: 3.357')).toBeInTheDocument();
  });

  // triste
  it('says there is no data instead of drawing an empty box', () => {
    render(<AzuosTreemapChart data={{ slices: [], seriesLabel: 'Alvarás' }} ui={{ emptyLabel: 'Sem cidades' }} />);

    expect(screen.getByText('Sem cidades')).toBeInTheDocument();
  });
});
