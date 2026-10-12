import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { AzuosDateStepper } from './azuos-date-stepper.component';

function click(name: string | RegExp) {
  fireEvent.click(screen.getByRole('button', { name }));
}

describe('AzuosDateStepper', () => {
  // feliz
  it('asks the year first when nothing was chosen', () => {
    render(<AzuosDateStepper data={{ value: null }} actions={{ onChange: vi.fn() }} />);

    expect(screen.getByText('Qual é o ano?')).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Anos' })).toBeInTheDocument();
  });

  // feliz
  /* O caminho inteiro: é ele que impede a pessoa de escolher o dia sem ter dito o ano. */
  it('walks year, month and day and returns the date in ISO', () => {
    const onChange = vi.fn();
    render(<AzuosDateStepper data={{ value: null }} actions={{ onChange }} />);

    click('1990');
    expect(screen.getByText('Qual é o mês?')).toBeInTheDocument();

    click('Março');
    expect(screen.getByText('Qual é o dia?')).toBeInTheDocument();

    click('25');
    expect(onChange).toHaveBeenCalledWith('1990-03-25');
  });

  // feliz
  it('opens on the day when a date is already chosen, with it marked', () => {
    render(<AzuosDateStepper data={{ value: '1990-03-25' }} actions={{ onChange: vi.fn() }} />);

    expect(screen.getByText('Qual é o dia?')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '25' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: '24' })).toHaveAttribute('aria-pressed', 'false');
  });

  // feliz
  it('goes back to the year from the answer shown on top', () => {
    render(<AzuosDateStepper data={{ value: '1990-03-25' }} actions={{ onChange: vi.fn() }} />);

    click('Ano: 1990. Trocar');

    expect(screen.getByText('Qual é o ano?')).toBeInTheDocument();
  });

  // feliz
  it('goes back to the month from the answer shown on top', () => {
    render(<AzuosDateStepper data={{ value: '1990-03-25' }} actions={{ onChange: vi.fn() }} />);

    click('Mês: Março. Trocar');

    expect(screen.getByText('Qual é o mês?')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Março' })).toHaveAttribute('aria-pressed', 'true');
  });

  // feliz
  it('shows 29 days in February of a leap year', () => {
    render(<AzuosDateStepper data={{ value: '2024-02-10' }} actions={{ onChange: vi.fn() }} />);

    const days = screen.getByRole('group', { name: 'Dias de Fevereiro de 2024' });

    expect(within(days).getAllByRole('button')).toHaveLength(29);
  });

  // triste
  it('only lists the years inside the limit', () => {
    render(
      <AzuosDateStepper
        data={{ value: null, min: '2024-05-01', max: '2026-03-31' }}
        actions={{ onChange: vi.fn() }}
      />,
    );

    const years = within(screen.getByRole('group', { name: 'Anos' })).getAllByRole('button');

    expect(years.map((year) => year.textContent)).toEqual(['2024', '2025', '2026']);
  });

  // triste
  it('locks the months that are entirely outside the limit', () => {
    render(
      <AzuosDateStepper
        data={{ value: null, min: '2026-10-10', max: '2026-11-20' }}
        actions={{ onChange: vi.fn() }}
      />,
    );

    click('2026');

    expect(screen.getByRole('button', { name: 'Setembro' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Outubro' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Dezembro' })).toBeDisabled();
  });

  // triste
  it('locks the days outside the limit and does not return them', () => {
    const onChange = vi.fn();
    render(
      <AzuosDateStepper
        data={{ value: '2026-10-15', min: '2026-10-10', max: '2026-11-20' }}
        actions={{ onChange }}
      />,
    );

    expect(screen.getByRole('button', { name: '9' })).toBeDisabled();
    expect(screen.getByRole('button', { name: '10' })).toBeEnabled();

    click('9');
    expect(onChange).not.toHaveBeenCalled();
  });
});
