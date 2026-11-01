import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { themeColor } from '../../utils/theme-color.util';
import {
  AzuosCalendarChart,
  calendarOption,
  calendarRange,
  firstDayOfMonth,
} from './azuos-calendar-chart.component';



describe('calendarRange', () => {
  // feliz
  it('covers whole months, to the last day of the last one', () => {
    expect(calendarRange('2026-10-01', 12)).toEqual(['2026-10-01', '2027-09-30']);
    expect(calendarRange('2026-11-01', 4)).toEqual(['2026-11-01', '2027-02-28']);
  });

  it('starts on the first day of the current month', () => {
    expect(firstDayOfMonth(new Date(2026, 9, 24))).toBe('2026-10-01');
  });
});

describe('AzuosCalendarChart', () => {
  // feliz
  /* A escala vem ESCRITA ("Menos … Mais"): a cor não pode ser o único jeito de ler o quadro. */
  it('writes the scale next to the colours', () => {
    render(
      <AzuosCalendarChart
        data={{ days: [{ date: '2026-11-10', count: 3 }], seriesLabel: 'vencimentos' }}
      />,
    );

    expect(screen.getByText('Menos')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: /3 vencimentos/ })).toBeInTheDocument();
  });

  // triste
  it('says there is nothing due instead of drawing an empty calendar', () => {
    render(
      <AzuosCalendarChart
        data={{ days: [], seriesLabel: 'vencimentos' }}
        ui={{ emptyLabel: 'Nada vence' }}
      />,
    );

    expect(screen.getByText('Nada vence')).toBeInTheDocument();
    expect(screen.queryByText('Menos')).not.toBeInTheDocument();
  });
});

describe('calendarOption', () => {
  const THEME = {
    track: themeColor('--muted'),
    surface: themeColor('--card'),
    muted: themeColor('--muted-foreground'),
  };

  // feliz
  it('writes the day the Brazilian way with the count in the balloon', () => {
    const option = calendarOption(
      [{ date: '2026-10-24', count: 3 }],
      ['2026-10-01', '2027-09-30'],
      'vencimentos',
      THEME,
    ) as { tooltip: { formatter: (params: unknown) => string } };

    expect(option.tooltip.formatter({ value: ['2026-10-24', 3] })).toBe(
      '<b>24/10/2026</b><br/>3 vencimentos',
    );
  });

  // triste
  it('does not break on a day without a value', () => {
    const option = calendarOption([], ['2026-10-01', '2027-09-30'], 'vencimentos', THEME) as {
      tooltip: { formatter: (params: unknown) => string };
      visualMap: { max: number };
    };

    expect(option.tooltip.formatter({ value: [] })).toBe('<b>undefined/undefined/</b><br/>0 vencimentos');
    expect(option.visualMap.max).toBe(1);
  });
});
