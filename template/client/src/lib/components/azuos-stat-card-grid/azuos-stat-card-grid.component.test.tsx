import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { AzuosStatCardGrid } from './azuos-stat-card-grid.component';

describe('AzuosStatCardGrid', () => {
  // feliz
  it('shows every card it was given', () => {
    render(
      <AzuosStatCardGrid>
        <span>Total</span>
        <span>Concluídas</span>
      </AzuosStatCardGrid>,
    );

    expect(screen.getByText('Total')).toBeInTheDocument();
    expect(screen.getByText('Concluídas')).toBeInTheDocument();
  });

  /* Quatro colunas é o limite do que se compara de relance; a decisão mora aqui, uma vez. */
  it('caps the row at four columns', () => {
    const { container } = render(
      <AzuosStatCardGrid>
        <span>Total</span>
      </AzuosStatCardGrid>,
    );

    expect(container.firstElementChild?.className).toContain('lg:grid-cols-4');
  });

  it('accepts an extra class without losing the grid', () => {
    const { container } = render(
      <AzuosStatCardGrid ui={{ className: 'mb-6' }}>
        <span>Total</span>
      </AzuosStatCardGrid>,
    );

    expect(container.firstElementChild?.className).toContain('mb-6');
    expect(container.firstElementChild?.className).toContain('grid');
  });

  // triste
  /* Painel que ainda não carregou passa uma lista vazia. Melhor uma grade vazia que um erro. */
  it('renders nothing but the grid when there is no card', () => {
    const { container } = render(<AzuosStatCardGrid />);

    expect(container.firstElementChild?.children).toHaveLength(0);
  });
});
