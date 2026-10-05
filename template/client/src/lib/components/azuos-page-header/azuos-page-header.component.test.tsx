import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { AzuosPageHeader } from './azuos-page-header.component';

describe('AzuosPageHeader', () => {
  // feliz
  it('renders the title as the page heading', () => {
    render(<AzuosPageHeader data={{ title: 'Tarefas' }} />);

    expect(screen.getByRole('heading', { level: 1, name: 'Tarefas' })).toBeInTheDocument();
  });

  it('renders the actions it receives', () => {
    render(
      <AzuosPageHeader data={{ title: 'Tarefas' }}>
        <button type="button">Nova tarefa</button>
      </AzuosPageHeader>,
    );

    expect(screen.getByRole('button', { name: 'Nova tarefa' })).toBeInTheDocument();
  });

  // triste
  it('does not draw an empty description line when there is none', () => {
    const { container } = render(<AzuosPageHeader data={{ title: 'Tarefas' }} />);

    expect(container.querySelector('p')).toBeNull();
  });
});
