import { act, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type * as EchartsUtil from '../../utils/echarts.util';
import { themeColor } from '../../utils/theme-color.util';
import { AzuosHeatmapChart, cellsOf, heatmapOption } from './azuos-heatmap-chart.component';

/* Um ECharts de mentira, como no teste do `AzuosEchart`: o desenho em si é do ECharts; o que este
   componente decide é QUAL clique vira seleção e com que nome. */
const fakeChart = vi.hoisted(() => ({
  on: vi.fn(),
  setOption: vi.fn(),
  resize: vi.fn(),
  dispose: vi.fn(),
}));

vi.mock('../../utils/echarts.util', async (importOriginal) => ({
  ...(await importOriginal<typeof EchartsUtil>()),
  loadECharts: () => Promise.resolve({ init: () => fakeChart }),
}));

/** O que o ECharts chamaria num clique no desenho. */
async function chartClick(): Promise<(params: unknown) => void> {
  await waitFor(() => expect(fakeChart.on).toHaveBeenCalledWith('click', expect.any(Function)));
  const call = [...fakeChart.on.mock.calls]
    .reverse()
    .find((entry: unknown[]) => entry[0] === 'click');

  return call?.[1] as (params: unknown) => void;
}

afterEach(() => {
  fakeChart.on.mockClear();
});

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

const THEME = {
  track: themeColor('--muted'),
  surface: themeColor('--card'),
  muted: themeColor('--muted-foreground'),
  foreground: themeColor('--foreground'),
};

type Formatter = (params: unknown) => string;

describe('heatmapOption', () => {
  // feliz
  it('writes the row, the column and the count in the balloon', () => {
    const option = heatmapOption(DATA, themeColor('--primary'), THEME) as {
      tooltip: { formatter: Formatter };
    };

    expect(
      option.tooltip.formatter({ data: { row: 'Leyla', column: 'Resolvido', value: [0, 0, 9] } }),
    ).toBe('<b>Leyla</b><br/>Resolvido: 9');
  });

  /* Texto claro na célula escura e escuro na clara: com uma cor só, metade dos números some. */
  it('inverts the label colour on the fullest cells', () => {
    const option = heatmapOption(DATA, themeColor('--primary'), THEME) as {
      series: [{ data: { value: number[]; label: { color: string } }[] }];
    };
    const [full, , , light] = option.series[0].data;

    expect(full?.label.color).toBe('var(--primary-foreground)');
    expect(light?.label.color).toBe(THEME.foreground);
  });

  // triste
  it('leaves the empty cells unlabelled', () => {
    const option = heatmapOption(DATA, themeColor('--primary'), THEME) as {
      series: [{ label: { formatter: Formatter } }];
    };

    expect(option.series[0].label.formatter({ data: { value: [0, 1, 0] } })).toBe('');
    expect(option.series[0].label.formatter({ data: { value: [0, 1, 4] } })).toBe('4');
  });
});

describe('AzuosHeatmapChart selection', () => {
  // feliz
  it('opens the breakdown of the clicked cell, with its row and column', async () => {
    const onSelect = vi.fn();
    render(
      <AzuosHeatmapChart
        data={DATA}
        ui={{ color: themeColor('--primary') }}
        actions={{ onSelect }}
      />,
    );
    const click = await chartClick();

    act(() => click({ name: 'x', data: { row: 'Leyla', column: 'Parado' } }));

    expect(onSelect).toHaveBeenCalledWith({ row: 'Leyla', column: 'Parado' });
  });

  // triste
  /* Só a célula abre detalhamento: um clique no rótulo do eixo não diz linha E coluna. */
  it('ignores a click that is not on a cell', async () => {
    const onSelect = vi.fn();
    render(<AzuosHeatmapChart data={DATA} actions={{ onSelect }} />);
    const click = await chartClick();

    act(() => click({ name: 'Leyla', data: { row: 'Leyla' } }));

    expect(onSelect).not.toHaveBeenCalled();
  });

  it('does not look clickable when it opens nothing', () => {
    const { container } = render(<AzuosHeatmapChart data={DATA} />);

    expect(container.querySelector('.cursor-pointer')).not.toBeInTheDocument();
  });
});
