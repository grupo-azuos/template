import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { AzuosStatusBadge } from './azuos-status-badge.component';

describe('AzuosStatusBadge', () => {
  // feliz
  it('shows the label', () => {
    render(<AzuosStatusBadge data={{ label: 'Em andamento' }} />);

    expect(screen.getByText('Em andamento')).toBeInTheDocument();
  });

  /* O token de estado, e não a paleta crua: `bg-emerald-100` escrito aqui não acompanharia a
     troca de tema, e no escuro o selo ficaria claro com texto claro. */
  it('paints the tone it was given, with the state token', () => {
    const { container } = render(
      <AzuosStatusBadge data={{ label: 'Concluída' }} ui={{ tone: 'success' }} />,
    );

    expect(container.firstElementChild?.className).toContain('bg-success-soft');
    expect(container.firstElementChild?.className).toContain('text-success');
  });

  it('falls back to neutral when no tone was given, instead of having no color', () => {
    const { container } = render(<AzuosStatusBadge data={{ label: 'A fazer' }} />);

    expect(container.firstElementChild?.className).toContain('bg-ink-100');
  });

  // triste
  /* Um selo cinza escrito "—" faria parecer que alguém respondeu algo. */
  it('does not draw a badge for an empty status: says it was not filled', () => {
    render(<AzuosStatusBadge data={{ label: null }} />);

    expect(screen.getByText('Não preenchido')).toBeInTheDocument();
  });

  it('treats empty string and undefined as not filled', () => {
    const { rerender } = render(<AzuosStatusBadge data={{ label: '' }} />);
    expect(screen.getByText('Não preenchido')).toBeInTheDocument();

    rerender(<AzuosStatusBadge data={{ label: undefined }} />);
    expect(screen.getByText('Não preenchido')).toBeInTheDocument();
  });

  it('accepts an extra class without losing its own', () => {
    const { container } = render(
      <AzuosStatusBadge
        data={{ label: 'Concluída' }}
        ui={{ tone: 'success', className: 'ml-4' }}
      />,
    );

    expect(container.firstElementChild?.className).toContain('ml-4');
    expect(container.firstElementChild?.className).toContain('bg-success-soft');
  });
});
