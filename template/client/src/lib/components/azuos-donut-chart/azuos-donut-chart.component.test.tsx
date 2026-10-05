import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { AzuosDonutChart } from './azuos-donut-chart.component';

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
