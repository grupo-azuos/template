import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { AzuosColumnChart, barOption, columnOption } from './azuos-column-chart.component';

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
    const option = columnOption([{ label: 'Departamento Jurídico e Contratos', value: 4 }], 'Tarefas');
    const axis = option.xAxis as { axisLabel: { formatter: (label: string) => string } };

    expect(axis.axisLabel.formatter('Departamento Jurídico e Contratos')).toBe('Departamento Jurídi…');
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
