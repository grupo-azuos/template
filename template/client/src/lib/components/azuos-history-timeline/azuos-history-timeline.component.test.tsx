import { render, screen } from '@testing-library/react';
import { Lock } from 'lucide-react';
import { describe, expect, it } from 'vitest';

import {
  AzuosHistoryTimeline,
  formatHistoryDateTime,
  formatMinutesSpent,
  type AzuosHistoryEntry,
} from './azuos-history-timeline.component';

const ENTRY: AzuosHistoryEntry = {
  id: 1,
  kindLabel: 'Comentou',
  tone: 'neutral',
  authorName: 'Mariana Ribeiro',
  createdAt: '2026-10-01T15:40:00.000Z',
  description: 'Consegui reproduzir o problema.',
};

describe('formatMinutesSpent', () => {
  // feliz
  /* "150 min" obriga quem lê a fazer a conta de cabeça, e numa lista de vinte acontecimentos ninguém
     faz vinte contas. */
  it('keeps minutes under an hour', () => {
    expect(formatMinutesSpent(45)).toBe('45 min');
  });

  it('writes whole hours without the leftover minutes', () => {
    expect(formatMinutesSpent(120)).toBe('2 h');
  });

  it('writes hours and minutes together', () => {
    expect(formatMinutesSpent(150)).toBe('2 h 30 min');
  });

  // triste
  it('writes zero as zero minutes, since it is an answer', () => {
    expect(formatMinutesSpent(0)).toBe('0 min');
  });
});

describe('formatHistoryDateTime', () => {
  // feliz
  it('writes day and time, without the seconds nobody reads', () => {
    expect(formatHistoryDateTime('2026-10-02T14:30:00.000Z')).toMatch(
      /^\d{2}\/\d{2}\/\d{4} às \d{2}:\d{2}$/,
    );
  });

  // triste
  /* "Invalid Date" na tela é pior que nada: parece defeito do sistema, e é. */
  it('writes a dash for a broken instant, never "Invalid Date"', () => {
    expect(formatHistoryDateTime('ontem')).toBe('—');
  });
});

describe('AzuosHistoryTimeline', () => {
  // feliz
  it('shows who, when, what and of which kind', () => {
    render(<AzuosHistoryTimeline data={{ entries: [ENTRY] }} />);

    expect(screen.getByText('Comentou')).toBeInTheDocument();
    expect(screen.getByText('Mariana Ribeiro')).toBeInTheDocument();
    expect(screen.getByText('Consegui reproduzir o problema.')).toBeInTheDocument();
  });

  /* O acontecimento que ENCERRA é dito com palavras, e não só com a cor do selo: cor sozinha some
     para quem não distingue as cores, e some na impressão. */
  it('says a closing event in words, not only by the badge colour', () => {
    render(
      <AzuosHistoryTimeline
        data={{
          entries: [
            { ...ENTRY, meta: [{ icon: Lock, label: 'Encerrou o atendimento', isStrong: true }] },
          ],
        }}
      />,
    );

    expect(screen.getByText('Encerrou o atendimento')).toBeInTheDocument();
  });

  it('puts the instant in a time element, so it is machine readable', () => {
    const { container } = render(<AzuosHistoryTimeline data={{ entries: [ENTRY] }} />);

    expect(container.querySelector('time')).toHaveAttribute('datetime', '2026-10-01T15:40:00.000Z');
  });

  // triste
  it('says nothing happened yet instead of drawing an empty rail', () => {
    render(
      <AzuosHistoryTimeline
        data={{ entries: [] }}
        ui={{ emptyLabel: 'Nada aconteceu nesta tarefa ainda.' }}
      />,
    );

    expect(screen.getByText('Nada aconteceu nesta tarefa ainda.')).toBeInTheDocument();
  });

  it('shows the failure instead of the rail when loading failed', () => {
    render(
      <AzuosHistoryTimeline
        data={{ entries: [] }}
        state={{ error: 'Não consegui carregar o histórico.' }}
      />,
    );

    expect(screen.getByRole('alert')).toHaveTextContent('Não consegui carregar o histórico.');
  });

  it('draws no context line when the entry has no context', () => {
    render(<AzuosHistoryTimeline data={{ entries: [ENTRY] }} />);

    expect(screen.queryByText(/Estágio/)).not.toBeInTheDocument();
  });
});
