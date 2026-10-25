import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { AzuosChartValueList } from './azuos-chart-value-list.component';

describe('AzuosChartValueList', () => {
  // feliz
  it('writes every category with its value, for a screen reader', () => {
    render(<AzuosChartValueList data={{ slices: [{ label: 'Goiânia', value: 3357 }] }} />);

    expect(screen.getByText('Goiânia: 3.357')).toBeInTheDocument();
  });

  // triste
  it('writes nothing when there is nothing to read', () => {
    const { container } = render(<AzuosChartValueList data={{ slices: [] }} />);

    expect(container).toBeEmptyDOMElement();
  });
});
