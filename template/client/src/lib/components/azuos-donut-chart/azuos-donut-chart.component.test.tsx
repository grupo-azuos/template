import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type * as EchartsUtil from '../../utils/echarts.util';
import { themeColor } from '../../utils/theme-color.util';
import { AzuosDonutChart, donutOption } from './azuos-donut-chart.component';

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
  { label: 'A fazer', value: 6 },
  { label: 'Em andamento', value: 3 },
  { label: 'Concluída', value: 1 },
];

describe('AzuosDonutChart', () => {
  // feliz
  /* A LEGENDA COM O NOME ESCRITO é obrigatória: nenhuma paleta categórica passa no teste de
     daltonismo, então a cor nunca é o único jeito de saber qual fatia é qual. */
  it('writes every slice name next to its value and share', () => {
    render(<AzuosDonutChart data={{ slices: SLICES, seriesLabel: 'Tarefas' }} />);

    expect(screen.getByText('Em andamento')).toBeInTheDocument();
    expect(screen.getByText('60%')).toBeInTheDocument();
  });

  /* O total no meio do anel poupa a soma de cabeça — que é a conta que ninguém faz e todo mundo
     erra. */
  it('shows the total in the middle of the ring', () => {
    render(<AzuosDonutChart data={{ slices: SLICES, seriesLabel: 'Tarefas' }} />);

    expect(screen.getByText('10')).toBeInTheDocument();
  });

  /* O gráfico é o CAMINHO para a lista, não um enfeite: é assim que alguém sai de "3 em andamento"
     para "quais 3". */
  it('opens the breakdown from the legend', async () => {
    const onSelect = vi.fn();
    render(
      <AzuosDonutChart data={{ slices: SLICES, seriesLabel: 'Tarefas' }} actions={{ onSelect }} />,
    );

    await userEvent.click(screen.getByRole('button', { name: /Em andamento/ }));

    expect(onSelect).toHaveBeenCalledWith('Em andamento');
  });

  // triste
  /* Sem clique, a legenda é texto: um botão que não faz nada atrapalha o teclado e o leitor de tela. */
  it('draws no button in the legend when it opens nothing', () => {
    render(<AzuosDonutChart data={{ slices: SLICES, seriesLabel: 'Tarefas' }} />);

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('says there is no data instead of drawing an empty ring', () => {
    render(
      <AzuosDonutChart
        data={{ slices: [], seriesLabel: 'Tarefas' }}
        ui={{ emptyLabel: 'Nenhuma tarefa no período' }}
      />,
    );

    expect(screen.getByText('Nenhuma tarefa no período')).toBeInTheDocument();
  });

  it('keeps the box while loading, so the panel does not reflow', () => {
    const { container } = render(
      <AzuosDonutChart data={{ slices: [], seriesLabel: 'Tarefas' }} state={{ isLoading: true }} />,
    );

    expect(container.querySelector('[aria-busy="true"]')).toBeInTheDocument();
  });

  /* Total zero é divisão por zero na porcentagem: sem a guarda, cada fatia sairia como `NaN%`. */
  it('does not divide by zero when every slice is empty', () => {
    render(
      <AzuosDonutChart
        data={{ slices: [{ label: 'A fazer', value: 0 }], seriesLabel: 'Tarefas' }}
      />,
    );

    expect(screen.getByText('0%')).toBeInTheDocument();
    expect(screen.queryByText(/NaN/)).not.toBeInTheDocument();
  });
});

describe('donutOption', () => {
  // feliz
  it('writes the name, the count and the share in the balloon', () => {
    const option = donutOption(SLICES, 'Tarefas', { surface: themeColor('--card') }) as {
      tooltip: { formatter: (params: unknown) => string };
    };

    expect(option.tooltip.formatter({ name: 'A fazer', value: 6 })).toBe(
      '<b>A fazer</b><br/>Tarefas: 6 (60%)',
    );
  });

  // triste
  it('does not divide by zero in the balloon of an empty ring', () => {
    const option = donutOption([{ label: 'Nada', value: 0 }], 'Tarefas', {
      surface: themeColor('--card'),
    }) as {
      tooltip: { formatter: (params: unknown) => string };
    };

    expect(option.tooltip.formatter({ name: 'Nada', value: 0 })).toBe(
      '<b>Nada</b><br/>Tarefas: 0 (0%)',
    );
  });
});

describe('AzuosDonutChart selection on the ring', () => {
  // feliz
  it('opens the breakdown of the clicked slice', async () => {
    const onSelect = vi.fn();
    render(
      <AzuosDonutChart data={{ slices: SLICES, seriesLabel: 'Tarefas' }} actions={{ onSelect }} />,
    );
    const click = await chartClick();

    act(() => click({ name: 'Em andamento' }));

    expect(onSelect).toHaveBeenCalledWith('Em andamento');
  });
});
