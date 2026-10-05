import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { AzuosColumnChart } from './azuos-column-chart.component';

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

  /* O eixo escreve o nome de cada categoria: num gráfico de uma série só, a cor não identifica nada
     — quem identifica é o rótulo embaixo da coluna. */
  it('writes the category names on the axis', () => {
    render(<AzuosColumnChart data={{ slices: SLICES, seriesLabel: 'Tarefas' }} />);

    expect(screen.getByText('Caio Prado')).toBeInTheDocument();
  });

  /* Nome longo é CORTADO no eixo (o nome inteiro continua no balão): sem o corte, três nomes
     compridos girados se encavalam e nenhum fica legível. */
  it('shortens a long name on the axis', () => {
    render(
      <AzuosColumnChart
        data={{
          slices: [{ label: 'Departamento Jurídico e Contratos', value: 4 }],
          seriesLabel: 'Tarefas',
        }}
      />,
    );

    expect(screen.queryByText('Departamento Jurídico e Contratos')).not.toBeInTheDocument();
    expect(screen.getByText(/Departamento/)).toBeInTheDocument();
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
