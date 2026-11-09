import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { AzuosWidgetChart, optionOf } from './azuos-widget-chart.component';

const THEME = {
  foreground: '#000',
  muted: '#666',
  border: '#ddd',
  surface: '#fff',
  track: '#eee',
  font: 'Inter',
  success: '#0a0',
  info: '#00a',
  warning: '#aa0',
  danger: '#a00',
};

describe('AzuosWidgetChart', () => {
  // feliz
  it('lists the slices in text for screen readers next to a pie', () => {
    render(
      <AzuosWidgetChart
        data={{
          chart: { kind: 'pie', slices: [{ label: 'Pago', value: 4 }] },
          seriesLabel: 'alvarás',
        }}
      />,
    );

    expect(screen.getByText('Pago: 4')).toBeInTheDocument();
  });

  // feliz
  it('picks the drawing by the chart kind', () => {
    const slices = [{ label: 'Pago', value: 4 }];

    expect(JSON.stringify(optionOf({ kind: 'pareto', slices }, 'alvarás', THEME))).toContain(
      'line',
    );
    expect(
      JSON.stringify(
        optionOf({ kind: 'cumulative', points: [{ key: '2026-01', value: 1 }] }, 'alvarás', THEME),
      ),
    ).toContain('01/2026');
    expect(JSON.stringify(optionOf({ kind: 'rose', slices }, 'alvarás', THEME))).toContain(
      'radius',
    );
  });

  // triste
  it('says there is nothing to show without data', () => {
    render(
      <AzuosWidgetChart
        data={{
          chart: { kind: 'grouped', grouped: { series: [], categories: [] } },
          seriesLabel: 'alvarás',
        }}
      />,
    );

    expect(screen.getByText('Sem dados para mostrar')).toBeInTheDocument();
  });
});
