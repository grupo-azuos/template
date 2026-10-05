import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { AzuosEmptyState } from './azuos-empty-state.component';

describe('AzuosEmptyState', () => {
  // feliz
  it('says what is empty and what to do next', () => {
    render(
      <AzuosEmptyState
        data={{ title: 'Nenhuma tarefa ainda', description: 'Cadastre a primeira.' }}
      />,
    );

    expect(screen.getByText('Nenhuma tarefa ainda')).toBeInTheDocument();
    expect(screen.getByText('Cadastre a primeira.')).toBeInTheDocument();
  });

  it('shows the suggested action', () => {
    render(
      <AzuosEmptyState data={{ title: 'Nenhuma tarefa' }}>
        <button type="button">Nova tarefa</button>
      </AzuosEmptyState>,
    );

    expect(screen.getByRole('button', { name: 'Nova tarefa' })).toBeInTheDocument();
  });

  // triste
  it('does not draw an empty description line when there is none', () => {
    const { container } = render(<AzuosEmptyState data={{ title: 'Nada' }} />);

    expect(container.querySelectorAll('p')).toHaveLength(1);
  });
});
