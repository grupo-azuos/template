import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { AzuosRadarChart, RADAR_MAX_SLICES, shortenAxis } from './azuos-radar-chart.component';

const SLICES = [
  { label: 'Comercial', value: 18 },
  { label: 'Financeiro', value: 7 },
  { label: 'Jurídico', value: 12 },
  { label: 'Operações', value: 22 },
];

describe('shortenAxis', () => {
  // feliz
  it('keeps a short name as it is', () => {
    expect(shortenAxis('Comercial')).toBe('Comercial');
  });

  /* Nome longo cortado no eixo; o nome inteiro continua no balão e na lista — cortar é melhor que
     deixar dois nomes se encavalarem em volta da teia. */
  it('cuts a long name and marks the cut', () => {
    expect(shortenAxis('Comercial e pré-vendas')).toBe('Comercial e pré…');
  });

  // triste
  it('does not leave a trailing space before the ellipsis', () => {
    expect(shortenAxis('Operações e logística', 12)).toBe('Operações e…');
  });

  it('handles an empty name without breaking', () => {
    expect(shortenAxis('')).toBe('');
  });
});

describe('RADAR_MAX_SLICES', () => {
  /* Exportado para quem monta a tela decidir ANTES de desenhar: passando disso, o gráfico certo é a
     barra deitada. Fixar o número no teste é o que impede alguém de subi-lo sem pensar. */
  it('states the ceiling where the names start to overlap', () => {
    expect(RADAR_MAX_SLICES).toBe(12);
  });
});

describe('AzuosRadarChart', () => {
  // feliz
  /* A teia é uma FORMA, e forma não se lê em voz alta: sem a lista, quem usa leitor de tela não
     recebe nenhum dos números do gráfico. */
  it('gives every value to a screen reader, since a shape cannot be read aloud', () => {
    render(<AzuosRadarChart data={{ slices: SLICES, seriesLabel: 'Tarefas' }} />);

    expect(screen.getByText('Comercial: 18')).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(4);
  });

  it('draws the web when there are categories', () => {
    const { container } = render(
      <AzuosRadarChart data={{ slices: SLICES, seriesLabel: 'Tarefas' }} />,
    );

    expect(container.querySelector('[data-slot="chart"]')).toBeInTheDocument();
  });

  // triste
  it('says there is no data instead of drawing an empty web', () => {
    render(
      <AzuosRadarChart
        data={{ slices: [], seriesLabel: 'Tarefas' }}
        ui={{ emptyLabel: 'Nenhuma tarefa no período' }}
      />,
    );

    expect(screen.getByText('Nenhuma tarefa no período')).toBeInTheDocument();
  });

  it('keeps the box while loading, so the panel does not reflow', () => {
    const { container } = render(
      <AzuosRadarChart data={{ slices: [], seriesLabel: 'Tarefas' }} state={{ isLoading: true }} />,
    );

    expect(container.querySelector('[aria-busy="true"]')).toBeInTheDocument();
  });
});
