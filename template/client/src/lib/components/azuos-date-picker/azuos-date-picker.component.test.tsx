import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { AzuosDatePicker, dateFromIso, isoFromDate } from './azuos-date-picker.component';

describe('dateFromIso', () => {
  // feliz
  /* AO MEIO-DIA LOCAL, de propósito: `new Date('2026-10-20')` é meia-noite UTC, que no Brasil ainda
     é o dia 19 — e o calendário destacaria o dia errado. */
  it('keeps the same calendar day in any Brazilian time zone', () => {
    const date = dateFromIso('2026-10-20');

    expect(date?.getFullYear()).toBe(2026);
    expect(date?.getMonth()).toBe(9);
    expect(date?.getDate()).toBe(20);
  });

  it('accepts a full timestamp, reading only the date part', () => {
    expect(dateFromIso('2026-10-20T23:45:00.000Z')?.getDate()).toBe(20);
  });

  // triste
  it('returns nothing for an empty value', () => {
    expect(dateFromIso(null)).toBeUndefined();
    expect(dateFromIso('')).toBeUndefined();
  });

  /* Texto que não é data chega de um banco antigo ("NÃO POSSUI", "a definir"). Melhor nenhuma data
     que um "Invalid Date" na tela, que parece defeito do sistema. */
  it('returns nothing for text that is not a date', () => {
    expect(dateFromIso('a definir')).toBeUndefined();
    expect(dateFromIso('2026-13')).toBeUndefined();
  });
});

describe('isoFromDate', () => {
  // feliz
  /* Pelos campos LOCAIS, nunca por `toISOString`: à noite, no Brasil, o ISO já está no dia seguinte
     e a tarefa seria gravada com um dia de diferença. */
  it('writes the local calendar day, not the UTC one', () => {
    expect(isoFromDate(new Date(2026, 9, 20, 22, 30))).toBe('2026-10-20');
  });

  it('pads month and day to two digits', () => {
    expect(isoFromDate(new Date(2026, 0, 5, 12))).toBe('2026-01-05');
  });

  // triste
  it('returns nothing for no date and for an invalid one', () => {
    expect(isoFromDate(undefined)).toBeNull();
    expect(isoFromDate(new Date('x'))).toBeNull();
  });
});

describe('AzuosDatePicker', () => {
  // feliz
  it('shows the chosen date in the Brazilian format', () => {
    render(
      <AzuosDatePicker
        data={{ name: 'dueDate', value: '2026-10-20' }}
        ui={{ ariaLabel: 'Prazo' }}
        actions={{ onChange: vi.fn() }}
      />,
    );

    expect(screen.getByRole('button', { name: 'Prazo' })).toHaveTextContent('20 de out. de 2026');
  });

  /* O campo escondido é o que faz um `FormData` do formulário em volta enxergar a data. */
  it('keeps the ISO value reachable by the surrounding form', () => {
    const { container } = render(
      <AzuosDatePicker
        data={{ name: 'dueDate', value: '2026-10-20' }}
        actions={{ onChange: vi.fn() }}
      />,
    );

    expect(container.querySelector('input[name="dueDate"]')).toHaveValue('2026-10-20');
  });

  it('opens the calendar and reports the day that was picked, in ISO', async () => {
    const onChange = vi.fn();
    render(
      <AzuosDatePicker
        data={{ name: 'dueDate', value: '2026-10-20' }}
        ui={{ ariaLabel: 'Prazo' }}
        actions={{ onChange }}
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Prazo' }));
    await userEvent.click(screen.getByRole('button', { name: /22 de outubro de 2026/ }));

    expect(onChange).toHaveBeenCalledWith('2026-10-22');
  });

  /* O `locale` do date-fns não traduz os botões de navegação: eles nascem em inglês, e são vistos
     só por quem usa leitor de tela — o único canto da tela que ninguém confere a olho. */
  it('names the month navigation in Portuguese', async () => {
    render(
      <AzuosDatePicker
        data={{ name: 'dueDate', value: '2026-10-20' }}
        ui={{ ariaLabel: 'Prazo' }}
        actions={{ onChange: vi.fn() }}
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Prazo' }));

    expect(screen.getByRole('button', { name: 'Ir para o mês anterior' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Ir para o mês seguinte' })).toBeInTheDocument();
  });

  // triste
  it('shows the placeholder when no date was chosen', () => {
    render(
      <AzuosDatePicker
        data={{ name: 'dueDate', value: null }}
        ui={{ placeholder: 'Escolha o prazo' }}
        actions={{ onChange: vi.fn() }}
      />,
    );

    expect(screen.getByRole('button')).toHaveTextContent('Escolha o prazo');
  });

  it('does not open while disabled', async () => {
    render(
      <AzuosDatePicker
        data={{ name: 'dueDate', value: null }}
        ui={{ ariaLabel: 'Prazo' }}
        state={{ isDisabled: true }}
        actions={{ onChange: vi.fn() }}
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Prazo' }));

    expect(screen.queryByRole('grid')).not.toBeInTheDocument();
  });
});
