import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { AzuosProgressRing } from './azuos-progress-ring.component';

describe('AzuosProgressRing', () => {
  // feliz
  it('shows the rounded percentage and tells the screen reader how many items', () => {
    render(<AzuosProgressRing data={{ done: 13, total: 28 }} />);

    expect(screen.getByText('46%')).toBeInTheDocument();
    expect(screen.getByRole('progressbar', { name: 'Entregue: 13 de 28 itens' })).toHaveAttribute(
      'aria-valuenow',
      '46',
    );
  });

  it('is green when complete', () => {
    const { container } = render(<AzuosProgressRing data={{ done: 28, total: 28 }} />);

    expect(screen.getByText('100%')).toBeInTheDocument();
    expect(container.querySelector('.stroke-emerald-500')).not.toBeNull();
  });

  // triste
  /* Nada a cumprir não é atraso: sem vermelho, sem 0%. */
  it('shows a dash, not 0% in red, when there is nothing to do', () => {
    const { container } = render(<AzuosProgressRing data={{ done: 0, total: 0 }} />);

    expect(screen.getByText('—')).toBeInTheDocument();
    expect(container.querySelector('.stroke-red-500')).toBeNull();
  });

  it('never goes over 100% when the count is inconsistent', () => {
    render(<AzuosProgressRing data={{ done: 30, total: 28 }} />);

    expect(screen.getByText('100%')).toBeInTheDocument();
  });
});
