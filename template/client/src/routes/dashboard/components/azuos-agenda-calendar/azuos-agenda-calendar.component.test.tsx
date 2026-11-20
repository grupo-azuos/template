import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import {
  AzuosAgendaCalendar,
  countsOf,
  levelOf,
  monthsBetween,
} from './azuos-agenda-calendar.component';

const RANGE = { from: '2026-11-01', to: '2026-11-30' };

describe('AzuosAgendaCalendar', () => {
  // feliz
  it('writes the count of each day in the window and dims the days outside it', () => {
    render(
      <AzuosAgendaCalendar
        data={{
          days: [
            { date: '2026-11-10', count: 3 },
            { date: '2026-11-20', count: 1 },
          ],
          range: { from: '2026-11-05', to: '2026-11-30' },
          seriesLabel: 'alvarás',
        }}
      />,
    );

    expect(screen.getByLabelText('10/11/2026: 3 alvarás')).toHaveTextContent('3');
    expect(screen.getByLabelText('20/11/2026: 1 alvarás')).toBeInTheDocument();
    expect(screen.getByLabelText('01/11/2026: fora da janela')).toBeInTheDocument();
    // Nenhum dia é botão: a agenda é só leitura.
    expect(screen.queryAllByRole('button')).toHaveLength(0);
  });

  // triste
  it('shows a loading placeholder instead of the calendar', () => {
    const { container } = render(
      <AzuosAgendaCalendar
        data={{ days: [], range: RANGE, seriesLabel: 'alvarás' }}
        state={{ isLoading: true }}
      />,
    );

    expect(container.querySelector('[aria-busy="true"]')).not.toBeNull();
  });
});

describe('agenda math', () => {
  // feliz
  it('counts the months a window touches and tones each day by the busiest one', () => {
    expect(monthsBetween('2026-11-20', '2027-02-17')).toBe(4);
    expect(levelOf(9, 10)).toBe('many');
    expect(levelOf(2, 10)).toBe('some');
    expect(countsOf([{ date: '2026-11-10', count: 4 }], 'alvarás').max).toBe(4);
  });

  // triste
  it('handles an empty day and a one-day window', () => {
    expect(levelOf(0, 0)).toBe('none');
    expect(monthsBetween('2026-11-10', '2026-11-10')).toBe(1);
    expect(countsOf([], 'alvarás').max).toBe(0);
  });
});
