import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BellOff, CalendarX, UserX } from 'lucide-react';
import { describe, expect, it, vi } from 'vitest';

import { AzuosPersonScoreCard, personScoreTone } from './azuos-person-score-card.component';

const METRICS = [
  { key: 'missing', label: 'Sem próxima', count: 3, icon: CalendarX },
  { key: 'overdue', label: 'Vencidos', count: 0, icon: BellOff },
];

describe('AzuosPersonScoreCard', () => {
  // feliz: o nome, a linha de baixo, o anel e os selos.
  it('shows the person, the score and the metrics', () => {
    render(
      <AzuosPersonScoreCard
        data={{
          name: 'Pessoa Exemplo',
          subtitle: '10 alvarás',
          score: 92.6,
          scoreLabel: 'Saúde',
          metrics: METRICS,
        }}
      />,
    );

    expect(screen.getByText('Pessoa Exemplo')).toBeInTheDocument();
    expect(screen.getByText('10 alvarás')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Saúde 93%' })).toBeInTheDocument();
    expect(screen.getByText('Sem próxima').closest('li')).toHaveClass('bg-destructive-soft');
    expect(screen.getByText('Vencidos').closest('li')).toHaveClass('bg-muted');
  });

  // feliz: clicável, o card inteiro abre, e o convite aparece.
  it('opens when clicked and shows the call to action', async () => {
    const onOpen = vi.fn();
    render(
      <AzuosPersonScoreCard
        data={{ name: 'Pessoa', score: 100, metrics: [], actionLabel: 'Ver alvarás' }}
        actions={{ onOpen }}
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Ver alvarás: Pessoa' }));

    expect(onOpen).toHaveBeenCalledOnce();
    expect(screen.getByText('Ver alvarás')).toBeInTheDocument();
  });

  // triste: sem `onOpen`, não é botão nem mostra convite; o ícone substitui o rosto.
  it('stays static and shows the placeholder icon when it is not a person', () => {
    const { container } = render(
      <AzuosPersonScoreCard
        data={{ name: 'Sem responsável', score: -5, metrics: [], actionLabel: 'Ver alvarás' }}
        ui={{ placeholderIcon: UserX }}
      />,
    );

    expect(screen.queryByRole('button')).toBeNull();
    expect(screen.queryByText('Ver alvarás')).toBeNull();
    expect(screen.getByRole('img', { name: '0%' })).toBeInTheDocument();
    expect(container.querySelector('.lucide-user-x')).not.toBeNull();
  });
});

describe('personScoreTone', () => {
  // feliz
  it('splits the score in green, yellow and red', () => {
    expect(personScoreTone(95)).toBe('success');
    expect(personScoreTone(85)).toBe('warning');
    expect(personScoreTone(84)).toBe('danger');
  });

  // triste: régua própria vence a padrão.
  it('honours custom thresholds', () => {
    expect(personScoreTone(60, { good: 80, fair: 50 })).toBe('warning');
  });
});
