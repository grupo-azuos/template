import { act, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type * as EchartsUtil from '../../utils/echarts.util';
import { AzuosSankeyChart, sankeyOption } from './azuos-sankey-chart.component';

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
  nodes: [
    { id: 'type:BOMBEIRO', label: 'BOMBEIRO', color: '#3b82f6' },
    { id: 'owner:N/A', label: 'N/A', color: '#10b981' },
    { id: 'stage:Parado', label: 'Parado', color: '#f59e0b' },
  ],
  links: [
    { from: 'type:BOMBEIRO', to: 'owner:N/A', value: 5 },
    { from: 'owner:N/A', to: 'stage:Parado', value: 5 },
  ],
  seriesLabel: 'Alvarás',
};
const THEME = { foreground: '#111', muted: '#666' };

describe('AzuosSankeyChart', () => {
  // feliz
  it('describes the flow in writing', () => {
    render(<AzuosSankeyChart data={DATA} />);

    expect(screen.getByRole('img', { name: /fluxo de 5 entre 3 etapas/ })).toBeInTheDocument();
  });

  /* O nó é achado pelo `id`, e o que aparece é o `label`: o mesmo nome pode existir em duas colunas
     sem os dois virarem um nó só. */
  it('keys the nodes by id and writes the label', () => {
    const series = (
      sankeyOption(DATA, THEME).series as {
        data: { name: string }[];
        label: { formatter: (p: unknown) => string };
      }[]
    )[0]!;

    expect(series.data.map((node) => node.name)).toEqual([
      'type:BOMBEIRO',
      'owner:N/A',
      'stage:Parado',
    ]);
    expect(series.label.formatter({ name: 'owner:N/A' })).toBe('N/A');
  });

  // triste
  it('says there is no flow instead of drawing an empty box', () => {
    render(<AzuosSankeyChart data={{ ...DATA, links: [] }} ui={{ emptyLabel: 'Sem fluxo' }} />);

    expect(screen.getByText('Sem fluxo')).toBeInTheDocument();
  });
});

type Formatter = (params: unknown) => string;

describe('sankeyOption balloons', () => {
  // feliz
  it('names both ends of a flow and the count', () => {
    const option = sankeyOption(DATA, THEME) as { tooltip: { formatter: Formatter } };

    expect(
      option.tooltip.formatter({
        dataType: 'edge',
        value: 5,
        data: { source: 'type:BOMBEIRO', target: 'owner:N/A' },
      }),
    ).toBe('BOMBEIRO → N/A<br/><b>5</b> alvarás');
  });

  it('names a stage by its label, not its id', () => {
    const option = sankeyOption(DATA, THEME) as {
      tooltip: { formatter: Formatter };
      series: [{ label: { formatter: Formatter } }];
    };

    expect(
      option.tooltip.formatter({ dataType: 'node', name: 'stage:Parado', value: 5, data: {} }),
    ).toBe('<b>Parado</b><br/>5 alvarás');
    expect(option.series[0].label.formatter({ name: 'stage:Parado' })).toBe('Parado');
  });

  // triste
  it('does not break on a node it does not know', () => {
    const option = sankeyOption(DATA, THEME) as {
      tooltip: { formatter: Formatter };
      series: [{ label: { formatter: Formatter } }];
    };

    expect(option.tooltip.formatter({ dataType: 'node', name: 'ghost', value: 1, data: {} })).toBe(
      '<b>ghost</b><br/>1 alvarás',
    );
    expect(option.tooltip.formatter({ dataType: 'edge', value: 1, data: {} })).toBe(
      ' → <br/><b>1</b> alvarás',
    );
    expect(option.series[0].label.formatter({ name: 'ghost' })).toBe('');
  });
});

describe('AzuosSankeyChart selection', () => {
  // feliz
  it('opens the breakdown of the clicked stage', async () => {
    const onSelect = vi.fn();
    render(<AzuosSankeyChart data={DATA} actions={{ onSelect }} />);
    const click = await chartClick();

    act(() => click({ name: 'stage:Parado', dataType: 'node' }));

    expect(onSelect).toHaveBeenCalledWith('stage:Parado');
  });

  // triste
  /* A faixa é "tipo X com a pessoa Y": o detalhamento filtra uma dimensão por vez. */
  it('ignores a click on a flow between two stages', async () => {
    const onSelect = vi.fn();
    render(<AzuosSankeyChart data={DATA} actions={{ onSelect }} />);
    const click = await chartClick();

    act(() => click({ name: 'type:BOMBEIRO > owner:N/A', dataType: 'edge' }));

    expect(onSelect).not.toHaveBeenCalled();
  });
});
