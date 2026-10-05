import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { AzuosAreaChart } from './azuos-area-chart.component';

const SERIES = [
  { key: 'created', label: 'Criadas', color: 'var(--chart-1)' },
  { key: 'done', label: 'Concluídas', color: 'var(--chart-2)' },
];

const POINTS = [
  { at: '2026-09-01T12:00:00.000Z', values: { created: 6, done: 3 } },
  { at: '2026-09-02T12:00:00.000Z', values: { created: 9, done: 5 } },
];

describe('AzuosAreaChart', () => {
  // feliz
  /* A legenda é HTML nosso e aparece ANTES de o desenho se medir: a tela nunca nasce com um gráfico
     sem explicação, e a cor nunca é o único jeito de saber qual série é qual. */
  it('names every series in writing, not only by colour', () => {
    render(<AzuosAreaChart data={{ points: POINTS, series: SERIES }} />);

    expect(screen.getByText('Criadas')).toBeInTheDocument();
    expect(screen.getByText('Concluídas')).toBeInTheDocument();
  });

  it('draws the chart when there are readings', () => {
    const { container } = render(<AzuosAreaChart data={{ points: POINTS, series: SERIES }} />);

    expect(container.querySelector('[data-slot="chart"]')).toBeInTheDocument();
  });

  // triste
  /* Uma leitura com data inválida quebraria a escala do tempo e o gráfico sumiria da tela sem dizer
     por quê. Ela é descartada em `toTimeRows`, e o resto continua desenhado. */
  it('drops a reading with a broken date instead of losing the whole chart', () => {
    const { container } = render(
      <AzuosAreaChart
        data={{
          points: [{ at: 'a definir', values: { created: 1, done: 0 } }, ...POINTS],
          series: SERIES,
        }}
      />,
    );

    expect(container.querySelector('[data-slot="chart"]')).toBeInTheDocument();
  });

  it('says there is no data when every reading was dropped', () => {
    render(
      <AzuosAreaChart
        data={{ points: [{ at: 'a definir', values: {} }], series: SERIES }}
        ui={{ emptyLabel: 'Sem leituras no período' }}
      />,
    );

    expect(screen.getByText('Sem leituras no período')).toBeInTheDocument();
  });

  it('keeps the box while loading, so the panel does not reflow', () => {
    const { container } = render(
      <AzuosAreaChart data={{ points: [], series: SERIES }} state={{ isLoading: true }} />,
    );

    expect(container.querySelector('[aria-busy="true"]')).toBeInTheDocument();
  });
});
