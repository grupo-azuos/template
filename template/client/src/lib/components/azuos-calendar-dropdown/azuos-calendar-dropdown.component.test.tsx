import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { AzuosCalendarDropdown, calendarMonthName } from './azuos-calendar-dropdown.component';

const MONTHS = [
  { value: 0, label: 'Janeiro', disabled: true },
  { value: 1, label: 'Fevereiro', disabled: false },
  { value: 2, label: 'Março', disabled: false },
];

function renderDropdown(props: { disabled?: boolean } = {}) {
  const onChange = vi.fn();
  render(
    <AzuosCalendarDropdown
      options={MONTHS}
      value={2}
      aria-label="Mês"
      onChange={onChange}
      {...props}
    />,
  );

  return { onChange };
}

function open() {
  fireEvent.click(screen.getByRole('button', { name: 'Mês: Março' }));
}

describe('calendarMonthName', () => {
  // feliz
  it('writes the month in Portuguese, in full and capitalized', () => {
    expect(calendarMonthName(new Date(2026, 2, 1, 12))).toBe('Março');
    expect(calendarMonthName(new Date(2026, 11, 1, 12))).toBe('Dezembro');
  });
});

describe('AzuosCalendarDropdown', () => {
  // feliz
  it('shows the current option and keeps the list closed', () => {
    renderDropdown();

    expect(screen.getByRole('button', { name: 'Mês: Março' })).toHaveTextContent('Março');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  // feliz
  it('opens our own list, with the current option marked', () => {
    renderDropdown();

    open();

    expect(screen.getByRole('listbox', { name: 'Mês' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Março' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('option', { name: 'Fevereiro' })).toHaveAttribute(
      'aria-selected',
      'false',
    );
  });

  // feliz
  /* O calendário espera o aviso de um `<select>`: lê só `target.value`. */
  it('tells the calendar the chosen value and closes the list', () => {
    const { onChange } = renderDropdown();

    open();
    fireEvent.click(screen.getByRole('option', { name: 'Fevereiro' }));

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange.mock.calls[0]?.[0].target.value).toBe('1');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  // feliz
  it('closes the list when the focus leaves it', () => {
    renderDropdown();

    open();
    fireEvent.blur(screen.getByRole('button', { name: 'Mês: Março' }));

    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  // triste
  it('does not use the native select', () => {
    const { container } = render(
      <AzuosCalendarDropdown options={MONTHS} value={2} aria-label="Mês" onChange={vi.fn()} />,
    );

    expect(container.querySelector('select')).toBeNull();
  });

  // triste
  it('does not choose an option outside the limit', () => {
    const { onChange } = renderDropdown();

    open();
    fireEvent.click(screen.getByRole('option', { name: 'Janeiro' }));

    expect(screen.getByRole('option', { name: 'Janeiro' })).toBeDisabled();
    expect(onChange).not.toHaveBeenCalled();
  });

  // triste
  it('does not open when disabled', () => {
    renderDropdown({ disabled: true });

    fireEvent.click(screen.getByRole('button', { name: 'Mês: Março' }));

    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });
});
