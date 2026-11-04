import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { Calendar } from './calendar';

const MARCH = new Date(2026, 2, 10);

describe('Calendar', () => {
  // feliz
  it('selects a day and reports it', () => {
    const onSelect = vi.fn();
    render(<Calendar mode="single" month={MARCH} selected={MARCH} onSelect={onSelect} />);

    fireEvent.click(screen.getByRole('button', { name: /March 20/ }));

    expect(onSelect).toHaveBeenCalled();
    expect(screen.getByRole('button', { name: /March 10/ })).toHaveAttribute('data-selected-single', 'true');
  });

  it('offers month and year dropdowns with short month names and the week numbers', () => {
    render(<Calendar mode="single" month={MARCH} captionLayout="dropdown" showWeekNumber buttonVariant="outline" />);

    expect(screen.getByRole('combobox', { name: /month/i })).toHaveTextContent('Mar');
    expect(screen.getByRole('combobox', { name: /year/i })).toBeInTheDocument();
    expect(screen.getAllByRole('rowheader').length).toBeGreaterThan(0);
  });

  it('moves the focus with the keyboard', () => {
    render(<Calendar mode="single" month={MARCH} />);
    const day = screen.getByRole('button', { name: /March 10/ });

    day.focus();
    expect(day).toHaveFocus();
    fireEvent.keyDown(day, { key: 'ArrowRight' });

    /* O dia exato que recebe o foco é decisão do react-day-picker; o que importa aqui é o foco
       continuar DENTRO da grade, num dia, e não pular para os botões de navegação. */
    expect(document.activeElement?.closest('table')).not.toBeNull();
    expect(document.activeElement?.tagName).toBe('BUTTON');
  });

  // triste
  it('does not draw the days of the neighbouring months when asked', () => {
    render(<Calendar mode="single" month={MARCH} showOutsideDays={false} />);

    expect(screen.queryByRole('button', { name: /February/ })).not.toBeInTheDocument();
  });
});
