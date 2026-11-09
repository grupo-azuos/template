import { act, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type * as EchartsUtil from '../../utils/echarts.util';
import { themeColor } from '../../utils/theme-color.util';
import { AzuosColumnChart, barOption, columnOption } from './azuos-column-chart.component';

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
  { label: 'Mariana Ribeiro', value: 8 },
  { label: 'Caio Prado', value: 5 },
  { label: 'Ana Luz', value: 2 },
];

describe('AzuosColumnChart', () => {
  // feliz
  it('draws the chart when there are slices', () => {
    const { container } = render(
      <AzuosColumnChart data={{ slices: SLICES, seriesLabel: 'Tarefas' }} />,
    );

    expect(container.querySelector('[data-slot="chart"]')).toBeInTheDocument();
  });

  /* Cada categoria com o valor ESCRITO, para o leitor de tela: num gráfico de uma série só, a cor não
     identifica nada — e um desenho não se lê em voz alta. */
  it('gives every category and value to a screen reader', () => {
    render(<AzuosColumnChart data={{ slices: SLICES, seriesLabel: 'Tarefas' }} />);

    expect(screen.getByText('Caio Prado: 5')).toBeInTheDocument();
  });

  /* Nome longo é CORTADO no eixo (o nome inteiro continua no balão): sem o corte, nomes compridos
     girados se encavalam e nenhum fica legível. */
  it('shortens a long name on the axis', () => {
    const option = columnOption(
      [{ label: 'Departamento Jurídico e Contratos', value: 4 }],
      'Tarefas',
    );
    const axis = option.xAxis as { axisLabel: { formatter: (label: string) => string } };

    expect(axis.axisLabel.formatter('Departamento Jurídico e Contratos')).toBe(
      'Departamento Jurídi…',
    );
  });

  /* Série no tempo: uma cor só, porque cada coluna é a mesma medida. */
  it('paints every column with one colour when asked', () => {
    const option = columnOption(SLICES, 'Tarefas', '#123456');
    const series = (option.series as { data: { itemStyle: { color: string } }[] }[])[0]!;

    expect(new Set(series.data.map((item) => item.itemStyle.color))).toEqual(new Set(['#123456']));
  });

  /* Deitada, o maior fica EM CIMA: é a ordem em que se lê um ranking. */
  it('puts the biggest bar on top when lying down', () => {
    const option = barOption(SLICES, 'Tarefas');

    expect((option.yAxis as { inverse: boolean }).inverse).toBe(true);
    expect((option.yAxis as { data: string[] }).data[0]).toBe('Mariana Ribeiro');
  });

  // triste
  /* Vazio é uma FRASE, e a frase mora na moldura: um quadro em branco se lê como defeito, e a pessoa
     recarrega a página em vez de entender que não há dado no período. */
  it('says there is no data instead of drawing an empty box', () => {
    render(
      <AzuosColumnChart
        data={{ slices: [], seriesLabel: 'Tarefas' }}
        ui={{ emptyLabel: 'Nenhuma tarefa no período' }}
      />,
    );

    expect(screen.getByText('Nenhuma tarefa no período')).toBeInTheDocument();
  });

  it('keeps the box while loading, so the panel does not reflow', () => {
    const { container } = render(
      <AzuosColumnChart
        data={{ slices: [], seriesLabel: 'Tarefas' }}
        state={{ isLoading: true }}
      />,
    );

    expect(container.querySelector('[aria-busy="true"]')).toBeInTheDocument();
  });

  /* Sem `onSelect` as colunas não ganham cursor de clique: um gráfico que parece clicável e não é
     vale menos que um gráfico que não parece. */
  it('does not look clickable when it opens nothing', () => {
    const { container } = render(
      <AzuosColumnChart data={{ slices: SLICES, seriesLabel: 'Tarefas' }} />,
    );

    expect(container.querySelector('.cursor-pointer')).not.toBeInTheDocument();
  });

  it('looks clickable when it opens the breakdown', () => {
    const { container } = render(
      <AzuosColumnChart
        data={{ slices: SLICES, seriesLabel: 'Tarefas' }}
        actions={{ onSelect: vi.fn() }}
      />,
    );

    expect(container.querySelector('.cursor-pointer')).toBeInTheDocument();
  });
});

type Formatter = (params: unknown) => string;
type AxisOption = { axisLabel: { formatter: (label: string) => string } };
type BarSeries = {
  data: { itemStyle: { color: string } }[];
  label: { formatter: (params: { value: unknown }) => string };
};

describe('columnOption and barOption', () => {
  // feliz
  it('writes the name and the count in the balloon and on the bar', () => {
    const standing = columnOption(SLICES, 'Tarefas') as {
      tooltip: { formatter: Formatter };
      series: [BarSeries];
    };
    const lying = barOption(SLICES, 'Tarefas') as {
      tooltip: { formatter: Formatter };
      series: [BarSeries];
    };

    expect(standing.tooltip.formatter({ name: 'Caio Prado', value: 5 })).toBe(
      '<b>Caio Prado</b><br/>Tarefas: 5',
    );
    expect(lying.tooltip.formatter({ name: 'Ana Luz', value: 2 })).toBe(
      '<b>Ana Luz</b><br/>Tarefas: 2',
    );
    expect(standing.series[0].label.formatter({ value: 1234 })).toBe('1.234');
    expect(lying.series[0].label.formatter({ value: '8' })).toBe('8');
  });

  /* O nome inteiro continua no balão; o eixo só corta o que não cabe. */
  it('shortens long names on both axes', () => {
    const long = 'Departamento Administrativo Financeiro';
    const standing = columnOption(SLICES, 'Tarefas') as { xAxis: AxisOption };
    const lying = barOption(SLICES, 'Tarefas') as { yAxis: AxisOption };

    expect(standing.xAxis.axisLabel.formatter(long).length).toBeLessThan(long.length);
    expect(lying.yAxis.axisLabel.formatter(long).length).toBeLessThan(long.length);
    expect(lying.yAxis.axisLabel.formatter('Ana')).toBe('Ana');
  });

  // triste
  /* Cor por coluna inventaria categorias que não existem numa série no tempo. */
  it('paints every bar alike when one colour is asked, and by category otherwise', () => {
    const one = barOption(SLICES, 'Tarefas', themeColor('--primary')) as { series: [BarSeries] };
    const many = barOption(SLICES, 'Tarefas') as { series: [BarSeries] };

    const oneColours = new Set(one.series[0].data.map((item) => item.itemStyle.color));
    const manyColours = new Set(many.series[0].data.map((item) => item.itemStyle.color));
    expect(oneColours.size).toBe(1);
    expect(manyColours.size).toBe(SLICES.length);
  });
});

describe('AzuosColumnChart selection', () => {
  // feliz
  it('opens the breakdown of the clicked column by its name', async () => {
    const onSelect = vi.fn();
    render(
      <AzuosColumnChart data={{ slices: SLICES, seriesLabel: 'Tarefas' }} actions={{ onSelect }} />,
    );
    const click = await chartClick();

    act(() => click({ name: 'Caio Prado' }));

    expect(onSelect).toHaveBeenCalledWith('Caio Prado');
  });
});
