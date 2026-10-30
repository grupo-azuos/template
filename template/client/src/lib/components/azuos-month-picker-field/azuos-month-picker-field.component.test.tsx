import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  AzuosMonthPickerField,
  type AzuosMonthPickerFieldProps,
} from './azuos-month-picker-field.component';

function renderField(
  overrides: {
    data?: Partial<AzuosMonthPickerFieldProps['data']>;
    ui?: AzuosMonthPickerFieldProps['ui'];
    state?: AzuosMonthPickerFieldProps['state'];
  } = {},
) {
  const actions = { onChange: vi.fn() };

  render(
    <AzuosMonthPickerField
      data={{ value: '', label: 'Mês do calendário', ...overrides.data }}
      ui={overrides.ui}
      state={overrides.state}
      actions={actions}
    />,
  );

  return actions;
}

/* O Popover é do Radix: `fireEvent.click` abre; o `userEvent` trava no jsdom. */
function trigger() {
  return screen.getByRole('button', { name: /Mês do calendário/ });
}

/**
 * O relógio fica parado para "Este mês" e o destaque do mês corrente não mudarem de resultado
 * conforme o calendário anda — foi assim que um teste de Férias passou a falhar todo dia.
 */
beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  vi.setSystemTime(new Date('2026-10-05T12:00:00Z'));
});

afterEach(() => {
  vi.useRealTimers();
});

describe('AzuosMonthPickerField', () => {
  // feliz
  it('shows the chosen month in full, with the picker closed', () => {
    renderField({ data: { value: '2026-10' } });

    expect(trigger()).toHaveTextContent(/outubro de 2026/i);
    expect(screen.queryByRole('group', { name: 'Meses' })).not.toBeInTheDocument();
  });

  /* Os doze de uma vez: filtro de mês quase sempre é "este ano" ou "o ano passado". */
  // feliz
  it('opens the twelve months of the year at once', () => {
    renderField({ data: { value: '2026-10' } });
    fireEvent.click(trigger());

    expect(screen.getByRole('group', { name: 'Meses' })).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /de 2026$/ })).toHaveLength(12);
  });

  // feliz
  it('reports the month clicked, in the calendar format', () => {
    const actions = renderField({ data: { value: '2026-10' } });
    fireEvent.click(trigger());
    fireEvent.click(screen.getByRole('button', { name: 'março de 2026' }));

    expect(actions.onChange).toHaveBeenCalledWith('2026-03');
  });

  /* O ano é a navegação: voltar um ano é um clique, e não doze. */
  // feliz
  it('walks a whole year at a time', () => {
    renderField({ data: { value: '2026-10' } });
    fireEvent.click(trigger());
    fireEvent.click(screen.getByRole('button', { name: 'Ano anterior' }));

    expect(screen.getByText('2025')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'março de 2025' })).toBeInTheDocument();
  });

  // feliz
  it('clears the filter with "Limpar"', () => {
    const actions = renderField({ data: { value: '2026-10' } });
    fireEvent.click(trigger());
    fireEvent.click(screen.getByRole('button', { name: 'Limpar' }));

    expect(actions.onChange).toHaveBeenCalledWith('');
  });

  // triste
  it('shows no "Limpar" when there is nothing to clear', () => {
    renderField({ data: { value: '' } });
    fireEvent.click(trigger());

    expect(screen.queryByRole('button', { name: 'Limpar' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Este mês' })).toBeInTheDocument();
  });

  /* Mês que não existe não vira outro em silêncio: o campo fica vazio. */
  // triste
  it('refuses a month that does not exist, instead of inventing one', () => {
    renderField({ data: { value: '2026-13' }, ui: { placeholder: 'Escolher mês' } });

    expect(trigger()).toHaveTextContent('Escolher mês');
  });

  // triste
  it('announces the error and ties it to the field', () => {
    renderField({ state: { error: 'Informe o mês' } });

    expect(trigger()).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByRole('alert')).toHaveTextContent('Informe o mês');
  });

  // triste
  it('does not open while disabled', () => {
    renderField({ state: { isDisabled: true } });
    fireEvent.click(trigger());

    expect(screen.queryByRole('group', { name: 'Meses' })).not.toBeInTheDocument();
  });
});
