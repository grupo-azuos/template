import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { AzuosProgressBar } from './azuos-progress-bar.component';

describe('AzuosProgressBar', () => {
  // feliz
  it('shows the percentage and announces the progress to screen readers', () => {
    render(
      <AzuosProgressBar
        data={{ percentage: 62, done: 8, total: 13 }}
        ui={{ itemLabel: 'tarefas' }}
      />,
    );

    expect(screen.getByText('62%')).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '62');
    expect(screen.getByLabelText('Concluído: 8 de 13 tarefas')).toBeInTheDocument();
  });

  it('shows the count when asked', () => {
    render(
      <AzuosProgressBar data={{ percentage: 62, done: 8, total: 13 }} ui={{ showCount: true }} />,
    );

    expect(screen.getByText('8/13')).toBeInTheDocument();
  });

  it('changes the tone by range', () => {
    const { container, rerender } = render(
      <AzuosProgressBar data={{ percentage: 100, done: 13, total: 13 }} />,
    );
    expect(container.innerHTML).toContain('bg-chart-2');

    rerender(<AzuosProgressBar data={{ percentage: 10, done: 1, total: 13 }} />);
    expect(container.innerHTML).toContain('bg-chart-4');
  });

  // triste
  /* Nada a cumprir NÃO é 0%: uma barra vermelha zerada acusaria atraso onde não há. */
  it('does not draw an empty red bar when there is nothing to do', () => {
    render(<AzuosProgressBar data={{ percentage: 0, done: 0, total: 0 }} />);

    expect(screen.getByText('Nada a cumprir')).toBeInTheDocument();
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  });

  it('still draws the bar, empty, for one pending item', () => {
    render(<AzuosProgressBar data={{ percentage: 0, done: 0, total: 1 }} />);

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('clamps a percentage out of range instead of overflowing the bar', () => {
    render(<AzuosProgressBar data={{ percentage: 140, done: 7, total: 5 }} />);

    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100');
  });
});
