import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Bar, BarChart } from 'recharts';

import { AzuosChartFrame, configOfSeries } from './azuos-chart-frame.component';

const CONFIG = { value: { label: 'Tarefas', color: 'var(--chart-1)' } };

const drawing = (
  <BarChart data={[{ label: 'Seg', value: 12 }]}>
    <Bar dataKey="value" />
  </BarChart>
);

describe('configOfSeries', () => {
  // feliz
  /* A conversão aparece na área, na linha e na barra agrupada. Escrita à mão em cada uma, a
     primeira série nova entra sem cor em um dos gráficos — e fica invisível. */
  it('turns a series list into the colour and label contract', () => {
    expect(
      configOfSeries([
        { key: 'done', label: 'Concluídas', color: 'var(--chart-2)' },
        { key: 'open', label: 'Abertas', color: 'var(--chart-1)' },
      ]),
    ).toEqual({
      done: { label: 'Concluídas', color: 'var(--chart-2)' },
      open: { label: 'Abertas', color: 'var(--chart-1)' },
    });
  });

  // triste
  it('gives back an empty contract for no series', () => {
    expect(configOfSeries([])).toEqual({});
  });
});

describe('AzuosChartFrame', () => {
  // feliz
  it('draws the chart inside the frame', () => {
    const { container } = render(
      <AzuosChartFrame data={{ config: CONFIG }}>{drawing}</AzuosChartFrame>,
    );

    expect(container.querySelector('[data-slot="chart"]')).toBeInTheDocument();
  });

  // triste
  /* Carregando tem de ocupar a MESMA altura do gráfico: um bloco mais baixo faz a tela saltar
     quando o dado chega, e o painel inteiro se reorganiza embaixo dos olhos de quem lê. */
  it('keeps the box height while loading, so the screen does not jump', () => {
    const { container } = render(
      <AzuosChartFrame
        data={{ config: CONFIG }}
        ui={{ heightClass: 'h-72' }}
        state={{ isLoading: true }}
      >
        {drawing}
      </AzuosChartFrame>,
    );

    expect(container.firstElementChild?.className).toContain('h-72');
    expect(container.firstElementChild).toHaveAttribute('aria-busy', 'true');
  });

  it('says there is no data instead of drawing an empty box', () => {
    render(
      <AzuosChartFrame
        data={{ config: CONFIG }}
        state={{ isEmpty: true }}
        ui={{ emptyLabel: 'Nenhuma tarefa no período' }}
      >
        {drawing}
      </AzuosChartFrame>,
    );

    expect(screen.getByText('Nenhuma tarefa no período')).toBeInTheDocument();
  });

  it('has a default sentence for the empty state, so no chart stays mute', () => {
    render(
      <AzuosChartFrame data={{ config: CONFIG }} state={{ isEmpty: true }}>
        {drawing}
      </AzuosChartFrame>,
    );

    expect(screen.getByText('Sem dados para mostrar')).toBeInTheDocument();
  });
});
