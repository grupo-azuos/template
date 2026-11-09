import { act, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type * as EchartsUtil from '../../utils/echarts.util';
import { themeColor } from '../../utils/theme-color.util';
import {
  AzuosTreemapChart,
  OTHERS_ID,
  treemapOption,
  withOthers,
} from './azuos-treemap-chart.component';

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
    render(
      <AzuosTreemapChart
        data={{ slices: [], seriesLabel: 'Alvarás' }}
        ui={{ emptyLabel: 'Sem cidades' }}
      />,
    );

    expect(screen.getByText('Sem cidades')).toBeInTheDocument();
  });
});

const THEME = { surface: themeColor('--card'), muted: themeColor('--muted-foreground') };

type Formatter = (params: unknown) => string;

describe('treemapOption', () => {
  // feliz
  it('writes the name, the count and the share in the balloon and the block', () => {
    const option = treemapOption(withOthers(SLICES, 2), 'Empresas', THEME) as {
      tooltip: { formatter: Formatter };
      series: [{ label: { formatter: Formatter } }];
    };

    expect(option.tooltip.formatter({ name: 'Goiânia', value: 3357 })).toBe(
      '<b>Goiânia</b><br/>Empresas: 3.357 (85%)',
    );
    expect(option.series[0].label.formatter({ name: 'Anápolis', value: 541 })).toBe(
      'Anápolis\n541',
    );
  });

  // triste
  /* "Outros" não é uma categoria: fica cinza, para não parecer a maior cidade de todas. */
  it('paints the "Outros" block grey, unlike the cities', () => {
    const option = treemapOption(withOthers(SLICES, 2), 'Empresas', THEME) as {
      series: [{ data: { id: string; itemStyle: { color: string } }[] }];
    };
    const others = option.series[0].data.find((item) => item.id === OTHERS_ID);
    const city = option.series[0].data.find((item) => item.id === 'Goiânia');

    expect(others?.itemStyle.color).toBe(THEME.muted);
    expect(city?.itemStyle.color).not.toBe(THEME.muted);
  });
});

describe('AzuosTreemapChart selection', () => {
  // feliz
  it('opens the breakdown of the clicked city', async () => {
    const onSelect = vi.fn();
    render(
      <AzuosTreemapChart
        data={{ slices: SLICES, seriesLabel: 'Empresas' }}
        actions={{ onSelect }}
      />,
    );
    const click = await chartClick();

    act(() => click({ name: 'Goiânia', data: { id: 'Goiânia' } }));

    expect(onSelect).toHaveBeenCalledWith('Goiânia');
  });

  // triste
  /* "Outros" junta dezenas de cidades: não há UMA para filtrar. */
  it('ignores a click on the "Outros" block', async () => {
    const onSelect = vi.fn();
    render(
      <AzuosTreemapChart
        data={{ slices: SLICES, seriesLabel: 'Empresas' }}
        ui={{ maxItems: 2 }}
        actions={{ onSelect }}
      />,
    );
    const click = await chartClick();

    act(() => click({ name: 'Outros (2)', data: { id: OTHERS_ID } }));

    expect(onSelect).not.toHaveBeenCalled();
  });
});
