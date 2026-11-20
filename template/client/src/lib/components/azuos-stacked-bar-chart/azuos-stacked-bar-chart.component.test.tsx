import { act, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type * as EchartsUtil from '../../utils/echarts.util';
import { themeColor } from '../../utils/theme-color.util';
import {
  AzuosStackedBarChart,
  stackedBarOption,
  totalOf,
} from './azuos-stacked-bar-chart.component';

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

const SERIES = [
  { key: 'done', label: 'Entregue', color: '#047857' },
  { key: 'pending', label: 'Pendente', color: '#ffdc00' },
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
    render(
      <AzuosStackedBarChart
        data={{ categories: CATEGORIES, series: SERIES, seriesLabel: 'Tipos' }}
      />,
    );

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

const THEME = { foreground: themeColor('--foreground'), muted: themeColor('--muted-foreground') };
const DATA = { categories: CATEGORIES, series: SERIES, seriesLabel: 'Alvarás' };

type StackSeries = { label?: { formatter: (params: unknown) => string } };

describe('stackedBarOption', () => {
  // feliz
  /* O total só na ÚLTIMA série, no fim da linha inteira: o número de cada pedaço fica no balão. */
  it('writes the row total only on the last part', () => {
    const option = stackedBarOption(DATA, THEME) as { series: StackSeries[] };

    expect(option.series[0]?.label).toBeUndefined();
    expect(option.series[1]?.label?.formatter({ dataIndex: 0 })).toBe('9');
    expect(option.series[1]?.label?.formatter({ dataIndex: 1 })).toBe('6');
  });

  it('shortens a long category name on the axis', () => {
    const option = stackedBarOption(DATA, THEME) as {
      yAxis: { axisLabel: { formatter: (label: string) => string } };
    };
    const long = 'VIGILÂNCIA SANITÁRIA MUNICIPAL DE GOIÂNIA';

    expect(option.yAxis.axisLabel.formatter(long).length).toBeLessThan(long.length);
  });

  // triste
  it('writes zero for a row the data does not have', () => {
    const option = stackedBarOption(DATA, THEME) as { series: StackSeries[] };

    expect(option.series[1]?.label?.formatter({ dataIndex: 7 })).toBe('0');
  });
});

describe('AzuosStackedBarChart selection', () => {
  // feliz
  it('opens the breakdown of the clicked row', async () => {
    const onSelect = vi.fn();
    render(<AzuosStackedBarChart data={DATA} actions={{ onSelect }} />);
    const click = await chartClick();

    act(() => click({ name: 'BOMBEIRO' }));

    expect(onSelect).toHaveBeenCalledWith('BOMBEIRO');
  });
});
