import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { AzuosRadialChart, fractionOf } from './azuos-radial-chart.component';

describe('fractionOf', () => {
  // feliz
  it('gives the filled share of the ceiling', () => {
    expect(fractionOf(50, 100)).toBe(0.5);
    expect(fractionOf(84, 96)).toBeCloseTo(0.875);
  });

  // triste
  /* Teto zero é divisão por zero, e valor acima do teto desenharia um arco dando mais de uma volta.
     Os dois viram um gráfico que mente — e um gráfico que mente é pior que nenhum. */
  it('does not divide by zero when the ceiling is zero', () => {
    expect(fractionOf(10, 0)).toBe(0);
  });

  it('stops at a full turn when the value is above the ceiling', () => {
    expect(fractionOf(120, 96)).toBe(1);
  });

  it('stops at zero for a negative value', () => {
    expect(fractionOf(-5, 96)).toBe(0);
  });
});

describe('AzuosRadialChart', () => {
  // feliz
  /* O arco é o REFORÇO, nunca a única informação: ninguém mede um ângulo a olho. */
  it('writes the number in the middle, not only the arc', () => {
    render(<AzuosRadialChart data={{ value: 84, max: 96, label: 'Concluídas' }} />);

    expect(screen.getByText('84')).toBeInTheDocument();
    expect(screen.getByText('Concluídas')).toBeInTheDocument();
  });

  it('accepts a written display, for a unit or a ratio', () => {
    render(<AzuosRadialChart data={{ value: 72, label: 'Prazo', display: '72%' }} />);

    expect(screen.getByText('72%')).toBeInTheDocument();
  });

  it('shows the hint under the number', () => {
    render(
      <AzuosRadialChart
        data={{ value: 84, max: 96, label: 'Concluídas', hint: 'de 96 tarefas' }}
      />,
    );

    expect(screen.getByText('de 96 tarefas')).toBeInTheDocument();
  });

  // triste
  /* Carregando esconde o número: um "0" piscando antes do valor real se lê como "nenhuma". */
  it('hides the number while loading, instead of showing a zero', () => {
    render(
      <AzuosRadialChart
        data={{ value: 84, max: 96, label: 'Concluídas' }}
        state={{ isLoading: true }}
      />,
    );

    expect(screen.queryByText('84')).not.toBeInTheDocument();
  });

  it('draws no hint line when there is no hint', () => {
    render(<AzuosRadialChart data={{ value: 84, max: 96, label: 'Concluídas' }} />);

    expect(screen.getAllByText(/./, { selector: 'span' }).length).toBeLessThan(4);
  });
});
